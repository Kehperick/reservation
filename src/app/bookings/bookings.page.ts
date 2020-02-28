import { Component, OnInit } from '@angular/core';
import { BookingService } from './booking.service';
import { Booking } from './booking.model';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit {

  private bookingSub: Subscription;
  isLoading = false;
  loadedBookings: Booking[];
  constructor(
    private bookingService: BookingService,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.bookingService.bookings.subscribe(
      bookings => this.loadedBookings = bookings
     );
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.bookingService.fetchBookings().subscribe(
      () => this.isLoading = false
    );
  }

  onCancelBooking(offerId, slidingEl: IonItemSliding) {
    slidingEl.close();
    this.loadingController.create({
      message: 'cancelling...'
    }).then(loadingEl => {
      loadingEl.present();
      this.bookingService.cancelBooking(offerId).subscribe(
      () => loadingEl.dismiss()
    );
    });
    // cancel booking with id offerId

  }

  // tslint:disable-next-line: use-lifecycle-interface
  ngOnDestroy() {
    if (this.bookingSub) {
      this.bookingSub.unsubscribe();
    }
  }
}
