일일 병합(한국시간 17:40) 설정 안내

목적: `md_files/YYYY-MM-DD_HH_MM.md` 형식으로 생성된 변경 로그들을 매일 한국시간(KST) 오후 17:40에 병합하여 `YYYY-MM-DD_total.md`로 만들고, 병합한 개별 파일은 삭제합니다.

서버(컨테이너)의 시스템 시간이 UTC인 경우, KST(UTC+9) 17:40는 UTC 08:40입니다.

예시 crontab(운영체제의 crontab에 추가):

```
# run at 08:40 UTC daily -> which is 17:40 KST
40 8 * * * /usr/bin/python3 /apps/dodt_api/scripts/merge_md.py >> /apps/dodt_api/logs/merge_md.log 2>&1
```

또는 시스템이 KST 타임존으로 설정되어 있다면 아래처럼 사용:

```
# run at 17:40 local time (KST)
40 17 * * * /usr/bin/python3 /apps/dodt_api/scripts/merge_md.py >> /apps/dodt_api/logs/merge_md.log 2>&1
```

설치 절차:
1. `scripts/merge_md.py`가 실행 권한이 있는지 확인:
   `chmod +x /apps/dodt_api/scripts/merge_md.py`
2. 로그 디렉터리 생성(없을 경우):
   `mkdir -p /apps/dodt_api/logs`
3. crontab 편집:
   `crontab -e` 후 위 명령어 추가

테스트:
```
python3 /apps/dodt_api/scripts/merge_md.py 2026-01-06
```
이 명령은 `md_files/2026-01-06_*.md` 파일을 병합합니다.
