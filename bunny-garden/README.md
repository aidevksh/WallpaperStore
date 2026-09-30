# Bunny Garden

![Bunny Garden](preview.png)

파스텔 정원에서 깡충 뛰는 토끼와 나비, 바람에 흔들리는 꽃.

[ZIP 다운로드](https://github.com/aidevksh/WallpaperStore/releases/latest/download/bunny-garden.zip) · [전체 카탈로그](../README.md) · [WallpaperJS 릴리즈](https://github.com/aidevksh/WallpaperJS/releases)

## WebM 샘플

[WebM 다운로드](https://github.com/aidevksh/WallpaperStore/raw/refs/heads/main/bunny-garden/bunny-garden-2560x1600-60fps.webm)

M1 맥북 에어 13인치의 기본 해상도에 맞춘 **2560×1600 · 60fps · 30초 · 무음** VP9 영상입니다. 약 3.8MB이며 원본 비율을 유지하도록 양옆을 조금 잘랐습니다. 원본 애니메이션의 30초 구간을 담은 샘플로, 끝과 시작이 매끄럽게 이어지는 루프는 아닙니다.

재생성하려면 저장소 루트에서 `node scripts/record-bunny.mjs`를 실행하세요. FFmpeg와 Playwright Chromium이 필요하며 결과는 `dist/`에 저장됩니다. 영상에도 아래 제작자와 라이선스가 적용됩니다.

## 사용법

WallpaperJS에서 이 폴더 또는 ZIP을 가져와 디스플레이에 적용하세요. 브라우저에서는 `index.html`을 열면 됩니다. 외부 네트워크·이미지·폰트·오디오가 필요하지 않습니다.

미리보기는 실제 렌더링을 캡처한 정지 이미지입니다. 애니메이션은 HTML을 열어 확인하세요. 화면 크기에 맞춰 렌더링됩니다.

## 제작 및 라이선스

제작자: **aidevksh** · Copyright 2026 aidevksh. 코드와 미리보기는 [Apache License 2.0](LICENSE)으로 배포합니다. 재배포 시 LICENSE와 NOTICE를 함께 포함하세요.

기본 애니메이션은 30fps이며, 숨겨진 창·WallpaperJS 일시정지·운영체제의 동작 줄이기 설정을 지원합니다.
