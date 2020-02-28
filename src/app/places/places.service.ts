import { Injectable } from '@angular/core';
import { Place } from './places.model';
import { AuthService } from './../auth/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
}
@Injectable({
  providedIn: 'root'
})

// new Place(
//   'p1',
//   'manhanthon mansion',
//   'in the heart of new your city',
//   'https://img.theculturetrip.com/768x432/wp-content/uploads/2019/01/fda03y.jpg',
//   144.99,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
//   ),

//   new Place(
//   'p2',
//   'L\'Amour tojour',
//   'romantic place in paris',
//   'https://d2mpqlmtgl1znu.cloudfront.net/AcuCustom/Sitename/DAM/020/Paris_AdobeStock_264549883_1.jpg',
//   50.99,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
//   ),
//   new Place(
//   'p3',
//   'L\'Amour tojour',
//   'romantic place in paris',
//   'https://www3.hilton.com/resources/media/hi/EWRSHHH/en_US/img/shared/full_page_image_gallery/main/HH_exterior01_1270x560_FitToBoxSmallDimension_Center.jpg',
//   50.99,
//   new Date('2019-01-01'),
//   new Date('2019-12-31'),
//   'abc'
//   )

export class PlacesService {
  // tslint:disable-next-line: variable-name
  private _places = new BehaviorSubject<Place[]>([]) ;

  fetchPlaces() {
    return this.authService.token.pipe(take(1),
    switchMap(token =>{
       return this.http.get<{[key: string]: PlaceData}>(`https://bookn-dcd36.firebaseio.com/offer-places.json?auth=${token}`)
    }),
      map( resData => {
      const places = [];
      for (const key in resData) {
        if (resData.hasOwnProperty(key)) {
          places.push(
            new Place(
              key, resData[key].title,
              resData[key].description,
              resData[key].imageUrl,
              resData[key].price,
              new Date(resData[key].availableFrom),
              new Date(resData[key].availableTo),
              resData[key].userId
               ));
        }
      }
      return places;
      }),
      tap(places => {
        this._places.next(places);
      })
    );
  }

  get places() {
    return this._places.asObservable();
  }


  getPlace(id: string) {
    return this.authService.token.pipe(take(1),switchMap(token =>{
    return this.http.get<PlaceData>(`https://bookn-dcd36.firebaseio.com/offer-places/${id}.json?auth=${token}`)
    }),
     map(placeData =>{
       return new Place(
        id,
        placeData.title,
        placeData.description,
        placeData.imageUrl,
        placeData.price,
        new Date(placeData.availableFrom),
        new Date(placeData.availableTo),
        placeData.userId
       )
     })
    )

  }

  addPlace(title: string, description: string, price: number, dateFrom: Date, dateTo: Date) {
    let generatedId: string;
    let newPlace: Place;
    let fetchedUserId: string;
    return this.authService.userId.pipe(take(1),
    switchMap(userId =>{
      fetchedUserId = userId;
      return this.authService.token
    }),
    take(1),
    switchMap(token =>{
      if(!fetchedUserId){
        throw new Error('Nouser id found ')
      }
      newPlace = new Place(
      Math.random().toString(),
      title,
      description,
      'https://d2mpqlmtgl1znu.cloudfront.net/AcuCustom/Sitename/DAM/020/Paris_AdobeStock_264549883_1.jpg',
      price,
      dateFrom,
      dateTo,
      fetchedUserId
    );
    return this.http.post<{name: string}>(
      `https://bookn-dcd36.firebaseio.com/offer-places.json?auth=${token}`,
      {...newPlace, id: null})
    }),switchMap(resData => {
          generatedId = resData.name;
          return this.places;
        }),
        take(1),
        tap(places =>  {
          newPlace.id = generatedId;
          this._places.next(places.concat(newPlace));
        })
      );

  }

  updatePlace(
    placeId: string,
    title: string,
    description: string
  ) {
    let updatePlaces: Place[];
     let fetchToken: string;
    return this.authService.token.pipe(take(1), switchMap(token =>{
      fetchToken = token;
      return this.places
    }),
      take(1), switchMap(places => {
        if(!places  || places.length <=0){
          return this.fetchPlaces()
        }
        else{
          return of(places);
        }
        
      }) ,
      switchMap(places =>{
        const updatePlaceIndex = places.findIndex(pl => pl.id === placeId);
        updatePlaces = [...places];
        const oldPlace = updatePlaces[updatePlaceIndex];
        updatePlaces[updatePlaceIndex] = new Place(oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId
          );
        return this.http.put(`https://bookn-dcd36.firebaseio.com/offer-places/${placeId}.json?auth=${fetchToken}`,
          {...updatePlaces[updatePlaceIndex], id: null}
          );
      }), tap(() => {
        this._places.next(updatePlaces);
      }))
  }

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }
}
