import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NavController, ModalController, ActionSheetController, LoadingController, AlertController } from '@ionic/angular';
import { CreateBookingComponent } from './../../../bookings/create-booking/create-booking.component';
import { Place } from '../../places.model';
import { PlacesService } from '../../places.service';
import { Subscription } from 'rxjs';
import { BookingService } from 'src/app/bookings/booking.service';
import { AuthService } from './../../../auth/auth.service';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit {

  place: Place;
  placeSub: Subscription;
  isLoading = false;
  isBookable = false;
  constructor(
    private router: Router,
    private navController: NavController,
    private modelController: ModalController,
    private placeService: PlacesService,
    private route: ActivatedRoute,
    private actionSheetController: ActionSheetController,
    private bookingService: BookingService,
    private loadingController: LoadingController,
    private authService: AuthService,
    private alertController: AlertController,
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(
      paramMap => {
        if (!paramMap.has('placeId')) {
          this.router.navigateByUrl('/places/tabs/discover');
          return;
        }
        this.isLoading = true;
        let fetchedUserId: string;
        this.authService.userId.pipe(take(1), switchMap(userId =>{

          if(!userId){
            throw new Error('No user found')
          }
          fetchedUserId = userId;
         return this.placeService.getPlace(paramMap.get('placeId'));

        })).subscribe(
          place => {
            this.place = place;
            this.isBookable = place.userId !== fetchedUserId;
            this.isLoading = false;
          },
          error => {
            this.alertController.create({
              header: 'an error occured',
              message: 'could not load place',
              buttons: [{
                text: 'okay',
                handler: () => {
                  this.router.navigate(['places/tabs/discover']);
                }
              }]
            }).then(alertEl => alertEl.present());
          }
        );
      }
    );

  }
  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
  onBookPlace() {
    // this.router.navigateByUrl('/places/tabs/discover');
    // this.navController.navigateBack('/places/tabs/discover')

    this.actionSheetController.create({
      header: 'choose an action',
      buttons: [
        {
          text: 'Select Date',
          handler: () => {
            this.openBookingModal('select');
          }
        },
        {
          text: 'Random Date',
          handler: () => {
            this.openBookingModal('random');
          }
        },
        {
          text: 'cancel',
          role: 'cancel'
        }
      ]
    }).then(actionSheetEl => {
      actionSheetEl.present();
    });

  }

  openBookingModal(mode: 'select'| 'random') {
    console.log(mode);
    this.modelController.create({
      component: CreateBookingComponent,
      componentProps: {selectedPlace: this.place, selectedMode: mode}
    }).then(
      modelEl => {
        modelEl.present();
        return modelEl.onDidDismiss();
      }
    ).then(resultData => {
      console.log(resultData.data, resultData.role);
      if (resultData.role === 'confirm') {
        this.loadingController.create({
          message: 'Booking place...'
        }).then(loadingEl => {
          loadingEl.present();
          const data = resultData.data.bookingData;
          console.log(data);
          this.bookingService.addBooking(this.place.id,
        this.place.title,
        this.place.imageUrl,
        data.firstName,
        data.lastName,
        data.guestNumber,
        data.startDate,
        data.endDate
        ).subscribe(
          () =>
          loadingEl.dismiss()
        );
      });
      }
    });
  }

}
