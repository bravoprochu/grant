import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormArray, Validators, FormGroup } from '@angular/forms';
import { HttpClient, HttpResponseBase, HttpHeaders } from '@angular/common/http';
import { takeUntil, delay, repeatWhen, startWith, take, switchMap, tap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { Subject, of, merge, forkJoin, Observable, interval } from 'rxjs';




@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private httpClient: HttpClient,
    private fb: FormBuilder
  ) {
  }

  autoReleaseAtTime: any;
  autoReleaseAtTime$: FormControl = new FormControl();



  defaultResponseText: string = `<div><p>Link będzie dopiero aktywny w terminie naboru. Kliknięcie w link w trakcie naboru więcej niż 3 razy może spowodować jego zablokowanie.</p><p>Składanie wniosków będzie możliwe od 24-08-2020 09:00. Więcej informacji znajdziecie Państwo na stronie <a href='http://www.warp.org.pl'>www.warp.org.pl</a></p><p><span style="color: black">UWAGA! Wiadomość wysłana automatycznie. Prosimy na nią nie odpowiadać.&nbsp;</p><p><em><span style="color: black">Zesp&oacute;ł Projektu</em></p><p><em><span style="color: black">GRANT</em></p></div>`;

  requestDelay: FormControl = new FormControl(1500);
  headers: HttpHeaders = new HttpHeaders({  })
  isAutoRelease$: FormControl = new FormControl(false);
  isAutoReleaseAtTime$: FormControl = new FormControl(true);
  isDestroyed$: Subject<boolean> = new Subject();
  isCanceled$: Subject<boolean> = new Subject();
  isRunning: boolean;
  isRunning$: Subject<boolean> = new Subject();
  isTimeUp$: Subject<boolean> = new Subject();


  linksForm$: FormGroup;
  linksToApply: string[] = [
    'https://jsonplaceholder.typicode.com/todos/52',
    'https://jsonplaceholder.typicode.com/todos/82',
  ];
  linksAreSent$: FormControl = new FormControl({ value: false, disabled: true });
  linksAreSentTwice$: FormControl = new FormControl({ value: false, disabled: true });


  logs: FormControl = new FormControl();
  logsArr: string[] = [];
  logsRefreshDelay: FormControl = new FormControl();




  testUrl: FormControl = new FormControl("https://jsonplaceholder.typicode.com/todos/52");


  hitRequest$ = (_delayTime: number, _url: string) => this.httpClient
    .get(_url, { observe: 'response', headers: this.headers })
    .pipe(
      catchError(err => this.handleError(err)),
      takeUntil(this.isDestroyed$),
      repeatWhen(w => w.pipe(
        takeUntil(this.isRunning$),
        delay(_delayTime)
      ))
    );


  hitRequestAndAbort$ = (_delayTime: number, _url: string) => this.httpClient
    .get(_url, { observe: 'response', headers: this.headers })
    .pipe(
      catchError(err => this.handleError(err)),
      repeatWhen(w => w.pipe(
        takeUntil(this.isRunning$),
        delay(_delayTime)
      ))
    );

  title = 'grant';


  urlOrRequestDelayChange$ = (_delayTime: number, _url: string) => merge(this.requestDelay.valueChanges, this.testUrl.valueChanges)
    .pipe(
      startWith(this.requestDelay.value),
      switchMap(sw => {
        if (isNaN(sw)) {
          return this.hitRequestAndAbort$(this.requestDelay.value, sw)
        } else {
          return this.hitRequestAndAbort$(sw, this.testUrl.value)
        }
      })
    );




  ngOnDestroy(): void {
    this.isDestroyed$.next(true);
    this.isDestroyed$.complete();
    this.isDestroyed$.unsubscribe();
  }

  ngOnInit(): void {
    this.initForms();
    this.prepLinks();
    this.initAutoReleaseTime()


    this.isRunning$.pipe(
      takeUntil(this.isDestroyed$),
      switchMap((sw: boolean) => {
        return sw ? this.urlOrRequestDelayChange$(this.requestDelay.value, this.testUrl.value) : of('nothing');
      }),

    )
      .subscribe(
        (_resp: any) => {
          // jesli odpowiedz jest typowa odpowiedzia i ma puszczac z automatu
          // to zatrzymaj petle i puszczaj wszystko...

          console.log(_resp);

          if (_resp instanceof HttpResponseBase && this.isAutoRelease$.value) {
            if (_resp.statusText.toLowerCase() == ("OK").toLowerCase()) {
              this.releaseAll();
            }
          }

          if (typeof _resp == 'string' || _resp instanceof String) {
            this.addToLog(this.handleResponse(null, _resp));
          } else {
            this.addToLog(this.handleResponse(_resp, null));
          }
        },
        (error) => console.log('_resp error', error),
        () => console.log('_resp completed..')
      );


    this.isAutoReleaseAtTime$.valueChanges.pipe(
      takeUntil(this.isDestroyed$),
      startWith(true),
      switchMap((sw: boolean) => {
        if (sw) {
          return interval(10).pipe(
            takeUntil(this.isTimeUp$)
          );
        } else {
          return of();
        }
      })
    )
      .subscribe(
        (_timerChecking: any) => {
          if (new Date().getTime() >= this.autoReleaseAtTime?.getTime()) {
            this.isTimeUp$.next(true);
            this.releaseAll();
          }
        },
        (error) => console.log('_timerChecking error', error),
        () => console.log('_timerChecking completed..')
      );



    this.autoReleaseAtTime$.valueChanges.pipe(
      takeUntil(this.isDestroyed$),
      tap(() => this.isAutoReleaseAtTime$.setValue(false)),
      debounceTime(1000),
      distinctUntilChanged()
    )
      .subscribe(
        (time: any) => {
          const today = new Date();
          //const _date = new Date(today.getFullYear(), today.getMonth(), today.getDay());

          const _month = today.getMonth() + 1 < 10 ? `0${today.getMonth() + 1}` : today.getMonth() + 1;
          const _day = today.getDate() < 10 ? `0${today.getDate()}` : today.getDate();

          const str = `${today.getFullYear()}-${_month}-${_day}T${time}Z`;
          const _date = new Date(str);
          const _dateUTC = new Date(str);
          _dateUTC.setHours(_dateUTC.getHours() - 2);

          console.log(_dateUTC, new Date(), (new Date().getTime() > _dateUTC.getTime()));
          console.log('is bigger ?', _dateUTC.getTime(), today.getTime(), today.getTime() > _dateUTC.getTime(), today.toLocaleDateString(), today.toLocaleTimeString(), _dateUTC.toLocaleDateString(), _dateUTC.toLocaleTimeString());


          if (typeof _date.getMonth === 'function') {
            this.autoReleaseAtTime = _dateUTC;

          }

        },
        (error) => console.log('_timeChanged error', error),
        () => console.log('_timeChanged completed..')
      );

  }


  initForms() {
    this.linksForm$ = this.fb.group({
      linksArr: this.fb.array([])
    });

  }

  initAutoReleaseTime() {
    const _date = new Date();
    const _newDate = new Date(_date.setMinutes(_date.getMinutes() + 5));

    this.autoReleaseAtTime$.setValue(_newDate.toLocaleTimeString());

  }



  addNewLink(link?: string) {
    const newLink = this.fb.control(link, Validators.required)
    this.linksArr$.push(newLink);
  }


  addToLog(info: string) {
    this.logsArr.unshift(info);
  }



  runIt() {
    this.isRunning = true;
    this.isRunning$.next(true);
  }

  cancelIt() {
    console.log('cancel it !!!');
    this.isRunning = false;
    this.isRunning$.next(false);

    this.isCanceled$.next(true);
  }


  logsClear() {
    this.logsArr = [];
  }


  prepLinks() {
    this.linksArr$.controls = [];

    this.linksToApply.forEach(link => {
      this.addNewLink(link);
    })

  }


  releaseAll() {
    this.cancelIt();

    if (this.linksAreSentTwice$.value) { return; }

    const listaLinkow: Observable<any>[] = [];
    this.linksArr$.controls.map(m => {
      listaLinkow.push(this.hitRequest$(0, m.value).pipe(take(1)))
    });

    forkJoin(listaLinkow).pipe(
      tap(() => {
        if (this.linksAreSent$.value) {
          this.linksAreSentTwice$.setValue(true);
        } else {
          this.linksAreSent$.setValue(true);
        }
      })
    )
      .subscribe(
        (_responseAll: any) => {
          this.addToLog('--- ||| ----');
          _responseAll.forEach(res => {
            console.log(res);
            this.addToLog(this.handleResponse(res, null));
          })
          this.addToLog('--- zatwierdzone linki - status ---');

        },
        (error) => console.log('_responseAll error', error),
        () => console.log('_responseAll completed..')
      );
  }


  releaseAllBrowsers() {
    this.linksArr$.controls.forEach(l => {
      window.open(l.value, "_blank");
    })
  }


  removeLink(index: number) {
    this.linksArr$.controls.splice(index, 1);
  }



  private handleResponse(resp: HttpResponseBase, body: any): string {
    const t = new Date();
    const info = resp ? `${resp.url} || ${resp.status} || ${resp.statusText}` : `${body}`;

    return `${t.toLocaleDateString()} - ${t.toLocaleTimeString()} | ${t.getMilliseconds()} | ${info}`
  }


  private handleError(error: any) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    }


    console.log(error);

    if (error.error instanceof String || typeof error.error == "string") {
      const text = error.error;
      const t1 = text.indexOf('<body>') + 6;
      const t2 = text.indexOf('</body>');

      const t: string = text.substr(t1, t2 - t1);
      if (t.length > 0) {
        return of(t);
      }
    }


    return of(error);

  }



  get linksArr$(): FormArray {
    return this.linksForm$.get('linksArr') as FormArray;
  }

}



