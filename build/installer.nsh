; electron-builder 自定义 NSIS 片段（由 package.json 的 nsis.include 引入）
;
; 目标：默认安装到 D:\deepseek-gal，没有 D 盘或 D 盘不可写时回退 electron-builder 的默认目录。
;
; 目录名必须与 APP_FILENAME（package.json 的 name = deepseek-gal）保持一致：
; electron-builder 在安装前有个 instFilesPre，会检查 $INSTDIR 里是否包含 APP_FILENAME，
; 不包含就在后面再拼一层 —— 写成 D:\深海回响 会变成 D:\深海回响\deepseek-gal。
;
; 另外 package.json 必须开 perMachine: true（2026-11-03 修）：
; perMachine 为 false 时会先弹「为所有用户 / 仅为我」页面，该页离开时执行
; setInstallModePerUser/PerAllUsers，会把 $INSTDIR 重置成 C:\Program Files\deepseek-gal，
; 本宏在 .onInit 里设的值会被静默冲掉（实测踩过）。
;
; 判断方式用 FileOpen 真实写一次，而不是 IfFileExists：
; 只判断"存在"会把光驱、只读分区、受组策略限制的数据盘放过去，
; 装到一半才失败，报错还看不懂。
;
; 每次尝试前先 ClearErrors：NSIS 的错误标志是全局的，
; 前面任何一步留下的错误都会让 ${Errors} 恒为真，导致整段逻辑被静默跳过。

!macro customInit
  ClearErrors
  FileOpen $0 "D:\__gal_probe__.tmp" w
  ${If} $0 != ""
    FileClose $0
    Delete "D:\__gal_probe__.tmp"
    StrCpy $INSTDIR "D:\deepseek-gal"
  ${EndIf}
  ClearErrors
!macroend