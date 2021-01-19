Załużmy że mamy testowy link do serwisu który aktualnie jest wyłączony jednak gdy tylko jego status się zmieni, chcemy do niego przesłać kilka innych linków (zgłoszeń ??)
Dodatkowo chcemy, by nie powodować problemu na serwerze, by nasze linki były wysłane max dwukrotnie (!!)

1) testowanie polega na puszczaniu requestow do serwera co okreslona ilosc opoznien (testowy URL)
- opóźnienie requestów - slider dowolna zmiana
2) opcje puszczenia:
- req z automatu - gdy tylko status testowanych req sie zmieni = puszczamy "paczke - linki do zatwierdzenia"
- puść o konkretnej godzinie (domyślnie app dodaje 5min)
- możemy też wypuścić pliki manualnie - "wypuść linki"
- tradycyjnie otworzyć zakładki dla każdego linku z osobna
3) Status wskzuje czy obie próby zostały zrealizowane

https://grant-mfs.azurewebsites.net

angular, angular material, RJXS


chrome CORS problem ? 
...google

Just do follow steps:
Right click on desktop, add new shortcut.
Add the target as "[PATH_TO_CHROME]\chrome.exe" --disable-web-security --disable-gpu --user-data-dir=~/chromeTemp.
Click OK.
