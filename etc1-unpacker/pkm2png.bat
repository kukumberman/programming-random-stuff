@echo off
setlocal enabledelayedexpansion

set directory="textures/pkm"

for /r "%directory%" %%x in (*.pkm) do (
	Rem set newName=%%~dpnx
	Rem set newName="!newName!.png"
	set input="%%x"
	etc1tool --decode !input!
)

pause
