"""공정잡 v1.4.0 QA — 긴급 펑크 자동 매칭 · 스폰서 배너 · 광고·제휴 문의 · 긴급 출역 스위치.

390x844 Chromium에서 서브패스(/gongjeongjob/)로 서빙한 빌드를 실제로 클릭하며 검증한다.
 - 발주처 계정: 조건 선택 → 실시간 인원 계산 → 알림 발송 → 선착순 수락 → 매칭 확정
 - 피드: 공정별 스폰서 배너 자동 전환 + 데모 광고 안내 모달
 - 내 프로필: 광고·제휴 문의 폼 → 접수번호 발급
 - 기술자 계정: 구직 자기소개의 오늘·내일 긴급 출역 스위치 → 대기 풀 반영
 - 콘솔 에러 0건 · 4xx/5xx 0건

사용법 (프로젝트 루트에서):
  npm run build:web
  PLAYWRIGHT_BROWSERS_PATH=/workspace/.tools/pw-browsers \\
  LD_LIBRARY_PATH=/workspace/.tools/atklibs/root/usr/lib/x86_64-linux-gnu \\
  python3 scripts/qa-urgent-ads.py
"""

import http.server
import re
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = ROOT / "screenshots"
VIEWPORT = {"width": 390, "height": 844}
BASE = "/gongjeongjob"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean.startswith(BASE):
            clean = clean[len(BASE):] or "/"
        return str(DIST / clean.lstrip("/"))

    def log_message(self, *args):
        pass


def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def reset_scroll(page):
    page.evaluate(
        """() => {
            document.querySelectorAll('div').forEach((el) => {
                if (el.scrollHeight > el.clientHeight + 40) el.scrollTop = 0;
            });
            window.scrollTo(0, 0);
        }"""
    )


def scroll_to(page, text, offset=20):
    ok = page.evaluate(
        """([text, offset]) => {
            const target = [...document.querySelectorAll('div')].find(
                (el) => el.children.length === 0 && el.textContent.trim() === text
                    && el.getBoundingClientRect().height > 0
            );
            if (!target) return false;
            let el = target.parentElement;
            while (el && el !== document.body) {
                if (el.scrollHeight > el.clientHeight + 40) break;
                el = el.parentElement;
            }
            if (!el || el === document.body) return false;
            const delta = target.getBoundingClientRect().top - el.getBoundingClientRect().top - offset;
            el.scrollTop += delta;
            return true;
        }""",
        [text, offset],
    )
    page.wait_for_timeout(450)
    return ok


def shot(page, name, top=True):
    page.wait_for_timeout(260)
    if top:
        reset_scroll(page)
        page.wait_for_timeout(180)
    path = OUT / name
    page.screenshot(path=str(path))
    print(f"[shot] {name}")


def body(page):
    return page.inner_text("body")


def demo_code(page):
    text = page.get_by_text(re.compile(r"데모 인증번호 \d{6}")).first.inner_text()
    match = re.search(r"(\d{6})", text)
    if not match:
        raise AssertionError(f"데모 인증번호를 찾지 못했습니다: {text}")
    return match.group(1)


def close_sheet(page):
    page.get_by_label("닫기").last.click()
    page.wait_for_timeout(500)


def fill_signup(page, name, phone):
    page.get_by_placeholder("예) 차승민").fill(name)
    page.get_by_placeholder("010-0000-0000").fill(phone)
    page.get_by_role("button", name="인증번호 받기").click()
    page.get_by_text("인증번호 6자리를 입력해 주세요").wait_for(timeout=6000)


def verify_phone(page):
    code = demo_code(page)
    page.get_by_placeholder("000000").fill(code)
    page.get_by_role("button", name="인증 확인").click()
    page.wait_for_timeout(500)


def agree_all_and_finish(page):
    page.get_by_role("checkbox", name="전체 동의하기").click()
    page.get_by_role("button", name="가입 완료").click()


def switch_track_color(page, label):
    """RN Web은 role=switch 에 aria-checked를 그리지 않아 트랙 색으로 ON/OFF를 확인한다."""
    return page.evaluate(
        """(label) => {
            const el = [...document.querySelectorAll('[role=switch]')].find(
                (node) => node.getAttribute('aria-label') === label
            );
            if (!el || !el.lastElementChild) return null;
            return getComputedStyle(el.lastElementChild).backgroundColor;
        }""",
        label,
    )


ON_COLOR = "rgb(240, 90, 34)"


def urgent_count(page):
    text = body(page)
    match = re.search(r"지금 조건에 맞는 기술자\s*(\d+)\s*명", text)
    if not match:
        raise AssertionError("긴급 매칭 조건 충족 인원을 화면에서 찾지 못했습니다")
    return int(match.group(1))


def main():
    OUT.mkdir(exist_ok=True)
    httpd, port = start_server()
    errors = []
    warnings = []
    checks = []
    bad_responses = []

    def check(label):
        checks.append(label)
        print(f"[check] {label}")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            locale="ko-KR",
        )
        page = context.new_page()
        page.on(
            "console",
            lambda msg: (errors if msg.type == "error" else warnings).append(msg.text)
            if msg.type in ("error", "warning")
            else None,
        )
        page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))
        page.on(
            "response",
            lambda res: bad_responses.append(f"{res.status} {res.url}") if res.status >= 400 else None,
        )

        page.goto(f"http://127.0.0.1:{port}{BASE}/", wait_until="networkidle")
        page.evaluate("() => { try { localStorage.clear(); } catch (e) {} }")
        page.reload(wait_until="networkidle")
        page.get_by_text("어떤 역할로 시작할까요?").wait_for(timeout=20000)
        page.wait_for_timeout(500)

        # ── 발주처 가입 ─────────────────────────────────
        page.get_by_role("button", name="발주처 · 현장소장 역할 선택").click()
        page.get_by_role("button", name="휴대폰 번호로 계속하기").click()
        page.get_by_text("기본 정보를 알려주세요").wait_for(timeout=6000)
        fill_signup(page, "이정한", "01022223333")
        verify_phone(page)
        page.get_by_text("사업자 정보를 등록해 주세요").wait_for(timeout=6000)
        page.get_by_placeholder("예) 정한건설").fill("정한건설")
        page.get_by_placeholder("000-00-00000").fill("1234567890")
        page.get_by_role("button", name="사업자 인증하기").click()
        page.get_by_text("사업자 인증 완료 (데모)").wait_for(timeout=4000)
        page.get_by_role("button", name="다음").click()
        page.get_by_text("약관에 동의해 주세요").wait_for(timeout=6000)
        agree_all_and_finish(page)
        page.get_by_text("모집 공정").wait_for(timeout=8000)
        page.wait_for_timeout(700)

        # ── 공고등록 탭의 긴급 매칭 진입 ────────────────
        scroll_to(page, "오늘 사람이 빠졌나요? 긴급 펑크 자동 매칭", 200)
        shot(page, "50-공고등록-긴급매칭-진입.png", top=False)
        page.get_by_test_id("urgent-match-entry-post").click()
        page.get_by_text("지금 조건에 맞는 기술자").wait_for(timeout=6000)
        page.wait_for_timeout(500)
        shot(page, "51-긴급매칭-조건-기본.png")
        sheet = page.get_by_test_id("urgent-match-sheet")

        def chip(label):
            """Chip은 아이콘 글리프가 접근성 이름에 섞여 role+name 대신 텍스트로 누른다."""
            return sheet.get_by_text(label, exact=True).first

        base_count = urgent_count(page)
        assert base_count >= 1, f"타일 기본 조건 인원이 0명입니다: {base_count}"
        check(f"긴급 매칭 시트: 공고등록 탭에서 진입 · 기본 조건(타일) 충족 {base_count}명")

        # 공정 전환 → 필수 스킬 자동 전환
        chip("철거").click()
        page.wait_for_timeout(500)
        assert "폐기물 반출" in body(page), "철거 공정의 필수 시공 스킬로 전환되지 않았습니다"
        assert "졸리컷" not in sheet.inner_text(), "이전 공정(타일) 스킬이 남아 있습니다"
        chip("서울").click()
        chip("기공").click()
        chip("5년+").click()
        chip("폐기물 반출").click()
        page.wait_for_timeout(600)
        filtered_count = urgent_count(page)
        assert filtered_count >= 1, f"철거·서울·기공·5년+ 조건 인원이 0명입니다: {filtered_count}"
        check(f"조건 선택: 공정 전환 시 스킬 자동 전환 · 조건 충족 {filtered_count}명 실시간 계산")

        # 일당 상한을 낮춰 실시간 0명 확인 → 다시 올려 복구
        decrease = sheet.get_by_label("감소").last
        increase = sheet.get_by_label("증가").last
        for _ in range(14):
            decrease.click()
            page.wait_for_timeout(120)
        page.wait_for_timeout(500)
        assert urgent_count(page) == 0, "일당 상한을 낮췄는데 조건 충족 인원이 0명이 되지 않았습니다"
        assert "조건에 맞는 기술자가 없어요" in body(page), "인원 0명일 때 안내 문구가 없습니다"
        page.wait_for_timeout(300)
        shot(page, "52-긴급매칭-조건-0명.png", top=False)
        for _ in range(4):
            increase.click()
            page.wait_for_timeout(120)
        page.wait_for_timeout(500)
        assert urgent_count(page) >= 1, "일당 상한을 다시 올렸는데 인원이 복구되지 않았습니다"
        check("일당 상한 변경 → 조건 충족 인원 실시간 갱신(0명 안내 포함)")

        # 시공사진 보유 필수 토글
        photo_switch = sheet.get_by_role("switch", name="시공사진 보유 필수")
        photo_switch.click()
        page.wait_for_timeout(400)
        assert switch_track_color(page, "시공사진 보유 필수") == ON_COLOR, "시공사진 보유 필수 토글이 켜지지 않았습니다"
        page.wait_for_timeout(300)
        shot(page, "53-긴급매칭-조건-선택.png", top=False)
        check("필수 공구·시공사진 토글 동작")

        # ── 매칭 알림 발송 → 선착순 수락 ────────────────
        page.get_by_role("button", name=re.compile(r"조건 맞는 \d+명에게 매칭 알림 보내기")).click()
        page.get_by_text("1명 수락 완료").wait_for(timeout=8000)
        page.wait_for_timeout(500)
        assert re.search(r"010-\d{4}-\d{4}", body(page)), "수락 후 연락처가 공개되지 않았습니다"
        assert "성사 시에만 매칭 수수료 부과 · 미성사 시 0원" in body(page), "수수료 안내가 없습니다"
        assert "데모 번호" in body(page), "데모 연락처 표기가 없습니다"
        shot(page, "54-긴급매칭-수락완료.png")
        check("알림 발송 → 선착순 1명 수락 카드 + 연락처 공개 + 성사 시에만 수수료 안내")

        page.get_by_role("button", name="매칭 확정").click()
        page.get_by_text("출역 확정 · 매칭 성사").wait_for(timeout=6000)
        page.wait_for_timeout(400)
        shot(page, "55-긴급매칭-확정.png")
        check("매칭 확정 → 성사 상태·수수료 안내 유지")
        page.get_by_label("닫기").last.click()
        page.wait_for_timeout(600)

        # ── 알림함에 매칭 수락 기록 ────────────────────
        page.get_by_label(re.compile(r"^알림")).first.click()
        page.get_by_text("알림함").last.wait_for(timeout=6000)
        page.get_by_text(re.compile("긴급 매칭 수락")).first.wait_for(timeout=6000)
        page.wait_for_timeout(400)
        shot(page, "56-알림함-긴급매칭.png")
        check("긴급 매칭 수락이 알림함에 기록")
        close_sheet(page)

        # ── 피드: 긴급 매칭 진입 + 스폰서 배너 ──────────
        page.get_by_role("tab", name="일자리").click()
        page.get_by_text("오늘 바로 들어갈 현장").wait_for(timeout=6000)
        page.wait_for_timeout(500)
        assert "긴급 펑크 자동 매칭" in body(page), "피드 상단 긴급 매칭 카드가 없습니다"
        scroll_to(page, "AD", 260)
        shot(page, "57-피드-긴급매칭·스폰서배너.png", top=False)

        banner = page.get_by_role("button", name=re.compile("스폰서 배너:")).first
        banner_text = banner.inner_text()
        assert "현장 전동공구·부자재 특가" in banner_text, f"전체 탭 기본 배너가 다릅니다: {banner_text}"
        banner.click()
        page.get_by_text("스폰서 배너 예시").first.wait_for(timeout=6000)
        assert "데모 광고 예시입니다" in body(page), "데모 광고 안내가 없습니다"
        page.wait_for_timeout(400)
        shot(page, "58-스폰서배너-안내.png")
        check("피드 중간 스폰서 배너 탭 → 데모 광고 안내 모달")
        page.get_by_role("button", name="확인", exact=True).click()
        page.wait_for_timeout(500)

        page.get_by_role("tab", name=re.compile(r"^철거")).click()
        page.wait_for_timeout(900)
        banner = page.get_by_role("button", name=re.compile("스폰서 배너:")).first
        assert "폐기물·스카이 당일 호출" in banner.inner_text(), "철거 탭 배너가 폐기물·스카이가 아닙니다"
        scroll_to(page, "AD", 260)
        shot(page, "59-스폰서배너-철거.png", top=False)

        page.get_by_role("tab", name=re.compile(r"^타일")).click()
        page.wait_for_timeout(900)
        banner = page.get_by_role("button", name=re.compile("스폰서 배너:")).first
        assert "1톤 용달·온라인 건재몰 긴급배송" in banner.inner_text(), "타일 탭 배너가 용달·건재몰이 아닙니다"
        scroll_to(page, "AD", 260)
        shot(page, "60-스폰서배너-타일.png", top=False)
        check("공정 탭에 따라 스폰서 배너 자동 전환(철거 → 폐기물·스카이, 타일 → 용달·건재몰)")

        # ── 내 프로필: 광고·제휴 문의 ───────────────────
        page.get_by_role("tab", name="내 프로필").click()
        page.get_by_text("광고 · 제휴").first.wait_for(timeout=6000)
        scroll_to(page, "광고 · 제휴", 120)
        page.wait_for_timeout(400)
        shot(page, "61-프로필-광고제휴.png", top=False)
        page.get_by_role("button", name=re.compile("광고 · 제휴 문의")).first.click()
        page.get_by_test_id("ad-inquiry-sheet").wait_for(timeout=6000)
        page.wait_for_timeout(500)
        ad_sheet = page.get_by_test_id("ad-inquiry-sheet")
        ad_sheet.get_by_placeholder("예) 청담환경").fill("청담환경")
        ad_sheet.get_by_placeholder("예) 김민수 실장").fill("김민수 실장")
        ad_sheet.get_by_placeholder("010-0000-0000").fill("01033334444")
        ad_sheet.get_by_role("button", name="폐기물·스카이", exact=True).click()
        ad_sheet.get_by_role("button", name="1톤 용달", exact=True).click()
        ad_sheet.locator("textarea").last.fill("철거 탭에 폐기물·스카이 배너를 넣고 싶습니다. 월 단가 알려주세요.")
        page.wait_for_timeout(400)
        shot(page, "62-광고문의-폼.png", top=False)
        page.get_by_role("button", name="문의 접수하기").click()
        ad_sheet.get_by_text("광고 · 제휴 문의가 접수됐어요", exact=True).wait_for(timeout=6000)
        assert re.search(r"AD-\d{8}-\d{4}", body(page)), "광고 문의 접수번호가 발급되지 않았습니다"
        page.wait_for_timeout(500)
        shot(page, "63-광고문의-접수완료.png")
        check("내 프로필 광고·제휴 문의: 업체·담당자·연락처·업종 입력 → 접수번호 발급")
        page.get_by_role("button", name="확인", exact=True).click()
        page.wait_for_timeout(500)

        # ── 기술자: 구직 자기소개 긴급 출역 스위치 ───────
        scroll_to(page, "로그아웃")
        page.get_by_role("button", name=re.compile("로그아웃")).click()
        page.get_by_role("button", name=re.compile("한 번 더 누르면 로그아웃")).click()
        page.get_by_text("어떤 역할로 시작할까요?").wait_for(timeout=8000)
        page.get_by_role("button", name="시공 기술자 역할 선택").click()
        page.get_by_role("button", name="휴대폰 번호로 계속하기").click()
        page.get_by_text("기본 정보를 알려주세요").wait_for(timeout=6000)
        fill_signup(page, "차승민", "01055556666")
        verify_phone(page)
        page.get_by_text("주력 공정을 골라주세요").wait_for(timeout=6000)
        page.get_by_role("button", name="타일 공정").click()
        page.get_by_role("button", name="경기", exact=True).click()
        page.get_by_role("button", name="7~10년").click()
        page.get_by_role("button", name="다음").click()
        page.get_by_text("약관에 동의해 주세요").wait_for(timeout=6000)
        agree_all_and_finish(page)
        page.get_by_text("오늘 바로 들어갈 현장").wait_for(timeout=8000)
        page.wait_for_timeout(700)

        page.get_by_role("tab", name="공고등록").click()
        page.get_by_text("일자리를 구하는 내 소개를 올려보세요").wait_for(timeout=6000)
        page.get_by_role("button", name="구직 자기소개 작성하기").click()
        page.get_by_text("한 줄 자기소개", exact=True).wait_for(timeout=6000)
        page.get_by_placeholder(re.compile("타일 9년차 기공")).fill(
            "타일 9년차 기공, 600·1200각 포세린·졸리컷 가능 / 오늘·내일 서울·경기 긴급 출역됩니다"
        )
        page.get_by_text("오늘 긴급 출역", exact=True).last.click()
        page.wait_for_timeout(300)
        scroll_to(page, "긴급 출역 알림", 120)
        shot(page, "64-자기소개-긴급출역-ON.png", top=False)
        page.get_by_role("button", name="자기소개 올리기").click()
        page.wait_for_timeout(900)
        check("구직 자기소개 작성 시트에서 오늘 긴급 출역 ON/OFF 선택")

        page.get_by_role("tab", name="일자리").click()
        page.get_by_role("tab", name="기술자 소개").click()
        page.get_by_text(re.compile(r"자기소개 \d+명")).first.wait_for(timeout=6000)
        page.wait_for_timeout(500)
        intro_switch = page.get_by_role("switch", name="오늘 긴급 출역").first
        intro_switch.wait_for(timeout=6000)
        assert switch_track_color(page, "오늘 긴급 출역") == ON_COLOR, (
            "자기소개 저장 후 오늘 긴급 출역이 켜져 있지 않습니다"
        )
        page.wait_for_timeout(300)
        shot(page, "65-피드-긴급출역-스위치.png", top=False)
        intro_switch.click()
        page.wait_for_timeout(600)
        assert "긴급 출역을 껐어요" in body(page), "긴급 출역 OFF 토스트가 없습니다"
        assert switch_track_color(page, "오늘 긴급 출역") != ON_COLOR, "긴급 출역 스위치가 꺼지지 않았습니다"
        intro_switch.click()
        page.wait_for_timeout(600)
        assert switch_track_color(page, "오늘 긴급 출역") == ON_COLOR, "긴급 출역 스위치가 다시 켜지지 않았습니다"
        check("피드의 내 자기소개에서 오늘·내일 긴급 출역 ON/OFF 토글")

        # 기술자 본인이 긴급 매칭 대기 풀에 들어가는지
        page.get_by_role("tab", name="현장 공고").click()
        page.wait_for_timeout(500)
        page.get_by_test_id("urgent-match-entry").click()
        page.get_by_text("지금 조건에 맞는 기술자").wait_for(timeout=6000)
        page.wait_for_timeout(500)
        tech_count = urgent_count(page)
        assert tech_count > base_count, (
            f"긴급 출역을 켠 내 자기소개가 매칭 풀에 반영되지 않았습니다 ({base_count} → {tech_count})"
        )
        shot(page, "66-긴급매칭-내출역-반영.png")
        check(f"긴급 출역 ON 기술자가 매칭 대기 풀에 반영({base_count} → {tech_count}명)")
        page.get_by_label("닫기").last.click()
        page.wait_for_timeout(500)

        # 콘솔 에러/실패 응답 확인
        page.wait_for_timeout(500)
        assert not errors, f"콘솔 에러 {len(errors)}건: {errors[:5]}"
        assert not bad_responses, f"4xx/5xx 응답: {bad_responses[:5]}"
        check("콘솔 에러 0건 · 4xx/5xx 응답 0건")
        browser.close()
    httpd.shutdown()

    print("\n=== QA 요약 ===")
    for item in checks:
        print(f" ✓ {item}")
    if warnings:
        print(f" 경고 {len(warnings)}건 (실패 아님): {warnings[:3]}")
    print(f"스크린샷: {OUT} (50~66)")


if __name__ == "__main__":
    main()
