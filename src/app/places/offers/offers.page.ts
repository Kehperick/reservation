import { Component, OnInit } from '@angular/core';
import { Place } from './../places.model';
import { MenuController, IonItemSliding } from '@ionic/angular';
import { Router } from '@angular/router';
import { PlacesService } from './../places.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit {

   offers: Place[];
   private placesSub: Subscription;
   isLoading = false;
  constructor(
    private placeService: PlacesService,
    private menuController: MenuController,
    private router: Router
  ) { }

  ngOnInit() {
    this.placesSub = this.placeService.places.subscribe(places => {
      this.offers = places;
    });
  }

  ionViewWillEnter(){
    this.isLoading = true;
    this.placeService.fetchPlaces().subscribe(
      ()=> this.isLoading = false 
    );
  }

  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }

  openMenu() {
    this.menuController.toggle();
  }

  onEdit(id: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    console.log('editing ');
    this.router.navigate(['/', 'places', 'tabs', 'offers', 'edit', id]);
  }

}
