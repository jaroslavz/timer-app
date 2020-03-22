import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, defer, interval, fromEvent, Subscription } from 'rxjs';
import { map, withLatestFrom, filter, share } from 'rxjs/operators';
import { FormatTimePipe } from 'src/app/pipes/format-time.pipe';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
  providers: [FormatTimePipe]
})
export class TimerComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('wait', { static: false }) waitBtn: ElementRef;

  value: number;
  notifications = {};
  keys = [];
  isStarted: boolean;
  waitBtnClick: boolean;
  subscription: Subscription;
  amountOfClicks = 0;

  constructor(private formatTimePipe: FormatTimePipe) { }

  ngOnInit(): void {
    this.addNotification();
  }

  ngAfterViewInit() {
    this.subscription = fromEvent(this.waitBtn.nativeElement, 'click')
      .subscribe(() => {
        // console.log('Button was clicked');
      });
  }

  addNotification() {
    const subject = new BehaviorSubject<boolean>(false);
    const notification = { id: new Date().getTime(), paused: subject, obs: this.getPausableTimer(subject) };
    this.notifications[notification.id] = notification;
    this.keys.push(notification.id);
  }

  dismiss(key: number) {
    this.keys = this.keys.filter(v => v !== key);
    delete this.notifications[key];
  }

  getPausableTimer(pause: BehaviorSubject<boolean>): { stepTimer: Observable<any> } {
    const pausableTimer$ = defer(() => {
      let seconds = 0;
      return interval(1000).pipe(
        withLatestFrom(pause),
        filter(([, paused]) => !paused),
        map(() => this.isStarted ? this.formatTimePipe.transform(seconds++) : this.formatTimePipe.transform(seconds))
      );
    }).pipe(share());

    return { stepTimer: pausableTimer$ };
  }

  startStopTimer(key: number, started: boolean) {
    this.isStarted = !started;
    this.notifications[key].paused.next(!this.isStarted);
  }

  waitTimer(key: number) {
    this.notifications[key].paused.next(true);
    this.amountOfClicks++;
    setTimeout(() => {
      if (this.amountOfClicks >= 2) {
        this.waitBtnClick = true;
        this.amountOfClicks = 0;
      } else {
        this.amountOfClicks = 0;
      }
      this.notifications[key].paused.next(this.waitBtnClick);
    }, 300);
  }


  resetTimer(key) {
    this.isStarted = false;
    this.dismiss(key);
    this.ngOnInit();
    this.waitBtnClick = false;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
