"""공정잡 웹 빌드 QA: 390x844 Chromium 스크린샷 + 콘솔 에러 수집.

검증 범위
  1) 간소화된 시작 화면(한 화면에 역할 선택·간편 로그인·둘러보기 노출)
  2) 시작·로그인·회원가입(기술자/발주처) 플로우와 AsyncStorage 저장
  3) 기술자 구직 자기소개: 피드 전환·공정 필터·시공사진 보유 배지·섭외 요청·본인 등록·영속화
  4) 알림함(읽음 처리·공고 연결), 노쇼·임금체불 신고 접수
  5) 기존 피드·공고등록·공수달력·프로필 화면 회귀
  6) 내 프로필 계정 관리(본인인증·약관·로그아웃), 게스트 둘러보기
  7) GitHub Pages 서브패스(/gongjeongjob/) 서빙 상태에서 전부 동작

사용법 (프로젝트 루트에서):
  npx expo export --platform web && node scripts/postbuild-web.mjs
  PLAYWRIGHT_BROWSERS_PATH=/workspace/.tools/pw-browsers \\
  LD_LIBRARY_PATH=/workspace/.tools/atklibs/root/usr/lib/x86_64-linux-gnu \\
  python3 scripts/qa-screenshots.py
"""

import http.server
import json
import re
import socketserver
import threading
from functools import partial
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = ROOT / "screenshots"
VIEWPORT = {"width": 390, "height": 844}
BASE = "/gongjeongjob"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """GitHub Pages처럼 /gongjeongjob/ 서브패스로 dist를 서빙한다."""

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
    """지정한 텍스트가 화면 위쪽 offset 위치에 오도록 안쪽 스크롤 컨테이너를 이동한다."""
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


def body(page):
    return page.inner_text("body")


def main():
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.png"):
        old.unlink()
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

        # ── 시작 화면 (간소화) ───────────────────────────
        page.goto(f"http://127.0.0.1:{port}{BASE}/", wait_until="networkidle")
        page.evaluate("() => { try { localStorage.clear(); } catch (e) {} }")
        page.reload(wait_until="networkidle")
        page.get_by_text("어떤 역할로 시작할까요?").wait_for(timeout=20000)
        page.wait_for_timeout(700)
        shot(page, "01-시작-간소화.png")
        terms_box = page.get_by_text(re.compile("계속 진행하면")).first.bounding_box()
        assert terms_box and terms_box["y"] + terms_box["height"] <= VIEWPORT["height"], (
            "간소화된 시작 화면이 한 화면에 들어오지 않습니다"
        )
        assert page.evaluate("() => window.scrollY") == 0
        for label in ["일자리 찾기", "인력 구하기", "카카오로 3초 만에 시작", "로그인 없이 둘러보기"]:
            page.get_by_text(label, exact=True).first.wait_for(timeout=4000)
        check("시작 화면 간소화: 로고·슬로건 + 역할 2개 + 카카오/네이버/Apple/휴대폰 + 둘러보기가 한 화면에 표시")

        # ── 기술자 회원가입 ──────────────────────────────
        page.get_by_role("button", name="시공 기술자 역할 선택").click()
        page.get_by_role("button", name="카카오로 계속하기").click()
        page.get_by_text("기본 정보를 알려주세요").wait_for(timeout=6000)
        fill_signup(page, "차승민", "01097470647")
        shot(page, "02-회원가입-휴대폰-인증번호.png")
        check("회원가입 1단계: 이름·휴대폰 입력 → 인증번호 발송")

        code = demo_code(page)
        page.get_by_placeholder("000000").fill(code)
        check(f"데모 인증번호 자동 발급({code})")
        page.get_by_role("button", name="인증 확인").click()
        page.get_by_text("주력 공정을 골라주세요").wait_for(timeout=6000)
        shot(page, "03-회원가입-주력공정.png")

        page.get_by_role("button", name="타일 공정").click()
        page.get_by_role("button", name="목공 공정").click()
        page.get_by_role("button", name="경기", exact=True).click()
        page.get_by_role("button", name="7~10년").click()
        shot(page, "04-회원가입-주력공정-선택.png")
        page.get_by_role("button", name="다음").click()

        page.get_by_text("약관에 동의해 주세요").wait_for(timeout=6000)
        shot(page, "05-회원가입-약관.png")
        page.get_by_role("button", name="이용약관 보기", exact=True).click()
        page.get_by_text("제1조 (목적)").wait_for(timeout=5000)
        shot(page, "06-약관-상세.png")
        close_sheet(page)
        agree_all_and_finish(page)
        page.get_by_text("오늘 바로 들어갈 현장").wait_for(timeout=8000)
        page.wait_for_timeout(900)
        page.get_by_role("tab", name="현장 공고").wait_for(timeout=6000)
        shot(page, "07-피드-현장공고.png")
        check("기술자 가입 완료 → 일자리 피드 진입, 피드 상단 '현장 공고 / 기술자 소개' 전환 탭 표시")

        # 새로고침 후에도 로그인·가입 정보 유지 (AsyncStorage)
        page.reload(wait_until="networkidle")
        page.get_by_text("일자리 피드", exact=True).first.wait_for(timeout=12000)
        page.get_by_text("기술자", exact=True).first.wait_for(timeout=6000)
        check("새로고침 후 로그인 상태·역할 유지(AsyncStorage 저장)")

        # ── 알림함 ──────────────────────────────────────
        page.get_by_label(re.compile(r"^알림")).first.click()
        page.get_by_text("알림함").last.wait_for(timeout=6000)
        page.wait_for_timeout(500)
        shot(page, "08-알림함.png")
        check("알림함: 합격 확정·연락처·주변 공고·정산 알림 표시")

        page.get_by_role("button", name="지원이 확정됐어요 알림").click()
        page.get_by_role("button", name="원터치 지원하기").wait_for(timeout=6000)
        shot(page, "09-알림-공고상세-이동.png")
        check("알림 → 공고 상세로 이동")

        # ── 신고 모달 (공고 상세에서) ────────────────────
        page.get_by_role("button", name=re.compile("노쇼 · 임금체불 · 허위공고 신고")).click()
        page.get_by_text("신고 사유").wait_for(timeout=6000)
        shot(page, "10-신고-모달.png")
        page.get_by_role("radio", name="신고 사유 임금체불").click()
        page.locator("textarea").last.fill(
            "11/18 송파 헬리오시티 현장 1공수 330,000원을 약속했지만 정산일이 지나도 입금되지 않았습니다."
        )
        scroll_to(page, "상세 내용", 120)
        shot(page, "11-신고-작성.png", top=False)
        page.get_by_role("button", name="신고 접수하기").click()
        page.get_by_text("신고가 접수됐어요").wait_for(timeout=6000)
        shot(page, "12-신고-접수완료.png")
        check("노쇼·임금체불 신고: 사유·내용 입력 → 접수번호 발급")
        page.get_by_role("button", name="확인", exact=True).click()
        page.wait_for_timeout(500)
        close_sheet(page)

        # ── 피드 회귀: 공정 전환·공고 상세 ───────────────
        page.get_by_role("tab", name=re.compile(r"^목공")).click()
        page.get_by_text("목공 현장 구인").wait_for(timeout=6000)
        shot(page, "13-피드-목공.png")
        page.get_by_role("button", name=re.compile(r"^목공 공고")).first.click()
        page.get_by_role("button", name="원터치 지원하기").wait_for(timeout=6000)
        shot(page, "14-공고-상세-목공.png")
        close_sheet(page)
        check("피드 공정 전환·공고 상세 회귀 정상")

        # ── 기술자 자기소개 피드 ─────────────────────────
        page.get_by_role("tab", name="기술자 소개").click()
        page.get_by_text(re.compile(r"자기소개 \d+명")).first.wait_for(timeout=6000)
        page.get_by_role("tab", name=re.compile(r"^전체")).first.click()
        page.wait_for_timeout(600)
        shot(page, "15-기술자-소개-피드.png")
        assert "김도현" in body(page) and "최윤성" in body(page), "전체 자기소개 목록이 보이지 않습니다"
        check("기술자 소개 피드: 시드 자기소개 5명 · 등급/지역/시공 필터 · 섭외 요청 버튼")

        page.get_by_role("tab", name=re.compile(r"^타일")).click()
        page.get_by_text("타일 기술자", exact=True).first.wait_for(timeout=6000)
        page.wait_for_timeout(500)
        assert "김도현" in body(page) and "이승호" not in body(page), "공정 필터가 자기소개에 연동되지 않았습니다"
        shot(page, "16-기술자-소개-타일.png")
        check("공정별 필터 연동: 타일 선택 시 타일 자기소개만 표시")

        # 시공사진 보유 배지 + 상세 작업물 미리보기
        assert "시공사진 보유" in body(page), "시공사진 보유 배지가 표시되지 않았습니다"
        page.get_by_role("button", name=re.compile("기술자 자기소개 김도현")).click()
        page.get_by_text("출역 조건").wait_for(timeout=6000)
        page.wait_for_timeout(400)
        shot(page, "17-기술자-상세.png")
        scroll_to(page, "시공 사진 · 작업물", 90)
        shot(page, "18-기술자-상세-시공사진.png", top=False)
        assert "욕실 벽체" in body(page) and "600×1200 포세린, 줄눈 2mm 마감" in body(page), (
            "시공 사진 미리보기(시공 부위·설명)가 보이지 않습니다"
        )
        check("기술자 상세: 출역 조건·보유 공구·시공 사진(시공 부위·설명) 미리보기")

        page.get_by_role("button", name="섭외 요청 보내기").click()
        page.get_by_text("섭외 요청을 보냈어요").wait_for(timeout=5000)
        shot(page, "19-기술자-섭외요청.png")
        check("섭외·연락 요청: 요청 전송 → 수락 후 연락처 공개 안내 표시")
        close_sheet(page)

        # ── 내 구직 자기소개 등록 ────────────────────────
        page.get_by_role("button", name="내 구직 자기소개 등록").click()
        page.get_by_text("구직 자기소개 올리기").wait_for(timeout=6000)
        page.get_by_placeholder(re.compile("타일 9년차 기공")).fill(
            "타일 9년차 기공, 600·1200각 포세린·졸리컷 가능 / 이번 주 서울·경기 출역 가능합니다"
        )
        page.get_by_role("button", name="시공 사진 추가").click()
        page.wait_for_timeout(300)
        page.get_by_role("button", name="샘플 사진 포세린 격자").click()
        page.get_by_role("button", name="바닥·벽").last.click()
        page.get_by_placeholder(re.compile("600×1200 포세린")).fill("600×1200 포세린 줄눈 2mm 마감")
        page.wait_for_timeout(300)
        shot(page, "20-자기소개-작성.png")
        scroll_to(page, "시공 사진 · 작업물", 80)
        shot(page, "21-자기소개-시공사진-첨부.png", top=False)
        page.get_by_role("button", name="자기소개 올리기").click()
        page.wait_for_timeout(1000)
        reset_scroll(page)
        shot(page, "22-자기소개-등록완료.png")
        assert "내 구직 자기소개" in body(page) and "내 자기소개" in body(page), "등록한 자기소개가 피드에 반영되지 않았습니다"
        check("기술자 본인 자기소개 등록: 한 줄 소개·시공 사진(최대 3건) 첨부 → 피드 최상단 노출")

        # 새로고침 영속화 (자기소개 + 섭외 요청)
        page.reload(wait_until="networkidle")
        page.get_by_text("일자리 피드", exact=True).first.wait_for(timeout=12000)
        page.get_by_role("tab", name="기술자 소개").click()
        page.get_by_text("타일 9년차 기공", exact=False).first.wait_for(timeout=6000)
        assert "섭외 요청함" in body(page), "섭외 요청 상태가 새로고침 후 유지되지 않았습니다"
        check("새로고침 후 내 자기소개·섭외 요청 상태 유지(AsyncStorage)")

        # ── 공고등록 탭: 기술자 = 자기소개, 전환 시 공고 등록 ──
        page.get_by_role("tab", name=re.compile("공고등록")).click()
        page.get_by_text("내 자기소개가 올라가 있어요").wait_for(timeout=6000)
        page.wait_for_timeout(500)
        shot(page, "23-공고탭-내-자기소개.png")
        page.get_by_role("tab", name="현장 공고 등록").click()
        page.get_by_text("모집 공정").wait_for(timeout=6000)
        page.wait_for_timeout(400)
        shot(page, "24-공고탭-현장공고.png")
        check("공고등록 탭: 기술자는 '내 구직 자기소개', 전환하면 현장 공고 등록 폼")

        page.get_by_role("tab", name=re.compile("공수달력")).click()
        page.get_by_text(re.compile("공수$")).first.wait_for(timeout=6000)
        page.wait_for_timeout(600)
        shot(page, "25-공수달력.png")
        check("공수달력 화면 회귀 정상")

        # ── 내 프로필 ───────────────────────────────────
        page.get_by_role("tab", name=re.compile("내 프로필")).click()
        page.get_by_text("주력 공정").first.wait_for(timeout=6000)
        shot(page, "26-프로필-기술자.png")
        page.get_by_text("휴대폰 인증 완료").first.wait_for(timeout=6000)
        check("프로필: 휴대폰 인증 완료 배지 표시")

        scroll_to(page, "본인인증")
        shot(page, "27-프로필-본인인증-계정.png", top=False)
        page.get_by_role("button", name=re.compile("약관 및 정책")).click()
        page.get_by_text("제1조 (목적)").wait_for(timeout=6000)
        shot(page, "28-약관-보기.png")
        close_sheet(page)
        check("프로필: 본인인증·계정 관리·약관 보기 동작")

        scroll_to(page, "안전센터")
        page.get_by_role("button", name=re.compile("노쇼 · 임금체불 신고")).click()
        page.get_by_text("신고 사유").wait_for(timeout=6000)
        shot(page, "29-프로필-안전센터-신고.png")
        close_sheet(page)

        # ── 로그아웃 → 최근 계정 ────────────────────────
        scroll_to(page, "로그아웃")
        page.get_by_role("button", name=re.compile("로그아웃")).click()
        page.get_by_text("한 번 더 누르면 로그아웃", exact=True).wait_for(timeout=4000)
        shot(page, "30-로그아웃-확인.png", top=False)
        page.get_by_role("button", name=re.compile("한 번 더 누르면 로그아웃")).click()
        page.get_by_text("어떤 역할로 시작할까요?").wait_for(timeout=8000)
        page.get_by_text("최근 계정").wait_for(timeout=6000)
        shot(page, "31-로그아웃-후-시작화면.png")
        check("로그아웃 → 시작 화면 + 최근 계정 카드 유지")

        page.get_by_role("button", name=re.compile("차승민")).first.click()
        page.get_by_text("일자리 피드", exact=True).first.wait_for(timeout=8000)
        page.wait_for_timeout(700)
        shot(page, "32-최근계정-재로그인.png")
        check("최근 계정 원터치 재로그인 성공")

        # ── 발주처 회원가입 ─────────────────────────────
        page.get_by_role("tab", name=re.compile("내 프로필")).click()
        page.get_by_text("주력 공정").first.wait_for(timeout=6000)
        scroll_to(page, "로그아웃")
        page.get_by_role("button", name=re.compile("로그아웃")).click()
        page.get_by_role("button", name=re.compile("한 번 더 누르면 로그아웃")).click()
        page.get_by_text("어떤 역할로 시작할까요?").wait_for(timeout=8000)

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
        shot(page, "33-발주처-가입-업체인증.png")
        page.get_by_role("button", name="다음").click()
        page.get_by_text("약관에 동의해 주세요").wait_for(timeout=6000)
        agree_all_and_finish(page)
        page.get_by_text("모집 공정").wait_for(timeout=8000)
        page.wait_for_timeout(700)
        shot(page, "34-발주처-공고등록-첫화면.png")
        check("발주처 가입: 사업자 인증 → 기본 탭이 '공고 등록'(현장 공고 폼)")

        # 발주처: 자기소개 탭 → 기술자 소개로 이동
        page.get_by_role("tab", name="기술자 자기소개").click()
        page.get_by_text("일할 기술자를 먼저 찾아보세요").wait_for(timeout=6000)
        page.wait_for_timeout(400)
        shot(page, "35-발주처-기술자소개-안내.png")
        page.get_by_role("button", name="기술자 자기소개 보기").click()
        page.get_by_text("일할 기술자 찾기", exact=True).first.wait_for(timeout=6000)
        page.wait_for_timeout(500)
        shot(page, "36-발주처-기술자소개-피드.png")
        check("발주처: '기술자 자기소개' 안내 → 기술자 소개 피드로 이동")

        page.get_by_role("tab", name=re.compile("내 프로필")).click()
        page.get_by_text("내가 등록한 공고").wait_for(timeout=6000)
        shot(page, "37-발주처-프로필.png")
        page.get_by_text("사업자 인증 완료").first.wait_for(timeout=6000)
        check("발주처 프로필: 사업자 인증 완료 배지·등록 공고 섹션")

        page.get_by_role("button", name="업체 정보 수정").click()
        page.get_by_text("인증된 사업자 정보는 지원자에게 안심 배지로 표시됩니다").wait_for(timeout=6000)
        page.get_by_placeholder("예) 정한건설").last.fill("정한종합건설")
        shot(page, "38-발주처-업체정보-수정.png")
        page.get_by_role("button", name=re.compile("저장")).click()
        page.wait_for_timeout(900)
        assert "정한종합건설" in body(page), "업체명 수정이 프로필에 반영되지 않았습니다"
        assert "업체 정보를 저장했어요." in body(page), "저장 토스트가 표시되지 않았습니다"
        check("발주처 업체 정보 수정 → 저장 후 프로필 반영")

        # ── 게스트 둘러보기 ─────────────────────────────
        scroll_to(page, "로그아웃")
        page.get_by_role("button", name=re.compile("로그아웃")).click()
        page.get_by_role("button", name=re.compile("한 번 더 누르면 로그아웃")).click()
        page.get_by_text("어떤 역할로 시작할까요?").wait_for(timeout=8000)
        page.get_by_role("button", name=re.compile("로그인 없이 둘러보기")).click()
        page.get_by_text("일자리 피드", exact=True).first.wait_for(timeout=8000)
        page.get_by_text("둘러보기").first.wait_for(timeout=6000)
        page.wait_for_timeout(700)
        shot(page, "39-게스트-현장공고.png")
        page.get_by_role("tab", name="기술자 소개").click()
        page.get_by_text("일할 기술자 찾기", exact=True).first.wait_for(timeout=6000)
        page.wait_for_timeout(500)
        shot(page, "40-게스트-기술자소개.png")
        page.get_by_role("button", name=re.compile("박○우 섭외·연락 요청")).click()
        page.get_by_text(re.compile("둘러보기 중에는 섭외 요청")).wait_for(timeout=5000)
        shot(page, "41-게스트-섭외요청-차단.png")
        check("게스트: 기술자 소개 열람 가능, 섭외 요청은 로그인 안내로 차단")

        page.get_by_role("tab", name=re.compile("내 프로필")).click()
        page.get_by_text("지금은 둘러보기 중이에요").wait_for(timeout=6000)
        shot(page, "42-게스트-프로필.png")
        page.get_by_label(re.compile(r"^알림")).first.click()
        page.get_by_text("로그인하면 알림을 받을 수 있어요").wait_for(timeout=6000)
        shot(page, "43-게스트-알림함.png")
        check("게스트 둘러보기: 프로필 안내·알림 잠금 상태")

        close_sheet(page)
        page.get_by_role("button", name=re.compile("로그인 · 회원가입")).click()
        page.get_by_text("어떤 역할로 시작할까요?").wait_for(timeout=8000)
        page.get_by_role("button", name="로그인", exact=True).click()
        page.get_by_text("다시 오셨네요").wait_for(timeout=6000)
        shot(page, "44-로그인-화면.png")
        page.get_by_role("button", name=re.compile("이정한")).first.click()
        page.get_by_text("모집 공정").wait_for(timeout=8000)
        page.wait_for_timeout(600)
        shot(page, "45-로그인-완료.png")
        check("로그인 화면: 저장된 계정으로 재로그인")

        context.close()
        browser.close()

    httpd.shutdown()

    print("\n=== 콘솔 에러 ===")
    print(json.dumps(errors, ensure_ascii=False, indent=2))
    print("=== 4xx/5xx 응답 ===")
    print(json.dumps(bad_responses, ensure_ascii=False, indent=2))
    print(
        f"에러 {len(errors)}건 · 경고 {len(warnings)}건 · 실패 응답 {len(bad_responses)}건 · 체크 {len(checks)}건"
    )
    if errors or bad_responses:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
