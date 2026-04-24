# 俄羅斯方塊 (Tetris) 實作計畫

開發一個純 HTML（包含內嵌 CSS 及 JavaScript）的俄羅斯方塊遊戲，滿足以下功能需求：
- 方向鍵控制（左右移動、加速下落）
- 音效支援（使用 Web Audio API 生成簡單音效，無需外部檔案）
- 豐富的顏色（各個方塊有專屬顏色）
- 預覽下一個方塊
- 直接下落（Hard Drop，例如按下空白鍵或上方向鍵）
- 左右旋轉（例如 Z 鍵、X 鍵或方向鍵上）

## User Review Required

> [!IMPORTANT]
> - 本專案預計僅產生一個 `index.html` 檔案，包含所有的 HTML、CSS 和 JavaScript 程式碼，方便直接點擊執行。
> - 音效部分將使用瀏覽器內建的 Web Audio API 合成，以確保不需要額外下載 `.wav` 或 `.mp3` 檔案，請問這樣是否符合您的期望？

## Open Questions

> [!WARNING]
> - 按鍵對應預計為：
>   - **左/右箭頭**：左右移動
>   - **下箭頭**：加速下落 (Soft Drop)
>   - **上箭頭** 或 **Z/X 鍵**：左右旋轉
>   - **空白鍵**：直接下落到底部 (Hard Drop)
>   如果有特定的按鍵喜好，請告訴我。

## Proposed Changes

### 遊戲主體

#### [NEW] [index.html](./index.html)
此檔案將包含：
1. **HTML 結構**：遊戲主要畫布 (Canvas)、顯示分數與等級的面板、以及預覽下一個方塊的畫布。
2. **CSS 樣式**：設定現代、動態且深色模式的網頁外觀，增強視覺體驗。
3. **JavaScript 邏輯**：
    - 方塊定義 (7種形狀與顏色)
    - 遊戲迴圈 (Game Loop)
    - 碰撞檢測
    - 按鍵事件監聽
    - Web Audio API 音效產生器 (移動、旋轉、消除、GameOver)

## Verification Plan

### Manual Verification
- 使用瀏覽器開啟 `index.html`
- 驗證畫面上方是否正確顯示遊戲區域與預覽區域
- 測試鍵盤控制是否符合預期（左右、旋轉、直接下落）
- 確認方塊具有多種顏色
- 聽取並確認在移動、旋轉、消除行時有適當的合成音效
- Agent 會執行瀏覽器錄影展示遊戲運作
