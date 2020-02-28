import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PlacesService } from './../../places.service';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { Place } from '../../places.model';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {

  place: Place;
  myForm: FormGroup;
  isLoading = false;
  placeId: string;
  private placeSub: Subscription;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private placeService: PlacesService,
    private navCtrl: NavController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(param => {
      if (!param.has('placeId')) {
        this.navCtrl.navigateBack('/place/tabs/offers');
        return;
      }
      this.placeId = param.get('placeId')
      this.isLoading = true;
      this.placeSub = this.placeService.getPlace(param.get('placeId')).subscribe(
        place => {
          this.place = place;
          this.myForm = new FormGroup({
        title: new FormControl(this.place.title, {
          updateOn: 'blur',
          validators: [Validators.required]
        }),
        description: new FormControl( this.place.description, {
          updateOn: 'blur',
          validators: [Validators.required, Validators.maxLength(180)]
        })
      });
      this.isLoading = false;
        },
       error =>{
        this.alertController.create({
          header: 'An Error Occured',
          message:' Place could not be fetched. Please try again later',
          buttons: [
            {
              text: 'Okay', handler: ()=>{
                this.router.navigate(['/places/tabs/offer']);
              }
            }
          ]
        }).then(alertEl => alertEl.present())
       } 
        );

    });
  }
  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
  onUpdateOffer() {
    console.log('updating...')
    if (!this.myForm.valid) {
      return;
    }
    this.loadingController.create({
      message: 'Updating place...'
    }).then(loadingEl => {
          loadingEl.present();
          this.placeService.updatePlace(
            this.place.id,
            this.myForm.value.title,
            this.myForm.value.description
            ).subscribe(
              () => {
                loadingEl.dismiss();
                this.myForm.reset();
                this.router.navigate(['/places/tabs/offers']);

              });
    });


  }

}
