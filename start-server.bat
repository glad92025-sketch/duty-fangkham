@echo off
title ระบบเวรยาม อบต.ฝางคำ
echo กำลังเปิดระบบเวรยาม อบต.ฝางคำ...
start http://localhost:8080/
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
