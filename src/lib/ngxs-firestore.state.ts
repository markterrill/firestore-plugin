import { State, StateContext, NgxsOnInit, Action } from '@ngxs/store';
import { NgxsFirestoreConnectActions } from './ngxs-firestore-connect.actions';
import { patch, insertItem, removeItem, updateItem } from '@ngxs/store/operators';
import { Injectable } from '@angular/core';

export interface FirestoreConnection {
  id: string;
  connectedAt: Date;
  emmitedAt: Date[];
}

export interface NgxsFirestoreStateModel {
  connections: FirestoreConnection[];
}

@State<NgxsFirestoreStateModel>({
  name: 'ngxs_firestore',
  defaults: {
    connections: []
  }
})
@Injectable()
export class NgxsFirestoreState implements NgxsOnInit {
  ngxsOnInit(_ctx: StateContext<NgxsFirestoreStateModel>) {}

  findDuplicates(arr) {
    return arr.filter((currentValue, currentIndex) =>
      arr.indexOf(currentValue) !== currentIndex);
  }

  @Action([NgxsFirestoreConnectActions.StreamConnected])
  streamConnected(
    { setState, getState }: StateContext<NgxsFirestoreStateModel>,
    { payload }: NgxsFirestoreConnectActions.StreamConnected
  ) {
    const conn = {
      connectedAt: new Date(),
      id: payload
    } as FirestoreConnection;
    setState(patch({ connections: insertItem(conn) }));
    const state = getState();

    if (state.connections.length > 10){
      console.log('firestore-plugin checking connections count: ' + state.connections.length);

      //const duplicates = this.findDuplicates(state.connections);

      let obj = [...state.connections];
      obj = obj.sort((a, b)=> {
        if (a.id === b.id){
          return a.connectedAt < b.connectedAt ? -1 : 1
        } else {
          return a.id < b.id ? -1 : 1
        }
      });





      //console.log('firestore-plugin after sort: ' + JSON.stringify(obj));
      console.log('firestore-plugin after sort: ' );
      obj.map(val => {
        console.log('firestore-plugin val ' + val.id + '  ' + val.connectedAt);
      });

      /*
      firestore-plugin val [User] Get Devices  2023-01-05T01:29:32.252Z
      ngxs-labs-firestore-plugin.js:72 firestore-plugin val [User] Get Devices  2023-01-05T01:36:31.793Z
      ngxs-labs-firestore-plugin.js:72 firestore-plugin val [User] Get Devices  2023-01-05T01:46:22.030Z
      ngxs-labs-firestore-plugin.js:72 firestore-plugin val [User] Get Devices  2023-01-05T01:58:36.144Z
      ngxs-labs-firestore-plugin.js:72 firestore-plugin val [User] Get Devices (ouD1tDBRK1hwaY0OqiRJuf5ZrkH2)  Thu Jan 05 2023 16:21:51 GMT+1100 (Australian Eastern Daylight Time)
      ngxs-labs-firestore-plugin.js:72 firestore-plugin val [User] Get Devices (ouD1tDBRK1hwaY0OqiRJuf5ZrkH2)  2023-01-05T03:45:19.625Z
      ngxs-labs-firestore-plugin.js:72 firestore-plugin val [User] Get Devices (ouD1tDBRK1hwaY0OqiRJuf5ZrkH2)  2023-01-05T04:00:41.592Z
       */


      obj = obj.filter((value, index, self) => {

        if (index == self.length - 1){ // keep the last value, it has to be correct
          return true;
        }

        if (value.id === self[index+1].id && value.connectedAt < self[index+1].connectedAt){
          console.log('firestore-plugin val FALSE ' + value.id + '  ' + value.connectedAt);
          return false;
        }

        return true;
      });


      console.log('firestore-plugin after filter: ' );
      obj.map(val => {
        console.log('firestore-plugin filtered ' + val.id + '  ' + val.connectedAt);
      });

    }

  }

  @Action([NgxsFirestoreConnectActions.StreamEmitted])
  streamEmitted(
    { setState, }: StateContext<NgxsFirestoreStateModel>,
    { payload }: NgxsFirestoreConnectActions.StreamEmitted
  ) {
    const { id } = payload;
    setState(
      patch<NgxsFirestoreStateModel>({
        connections: updateItem((x) => x.id === id, patch({ emmitedAt: insertItem(new Date()) }))
      })
    );
  }

  @Action([NgxsFirestoreConnectActions.StreamDisconnected])
  streamDisconnected(
    { setState, getState }: StateContext<NgxsFirestoreStateModel>,
    { payload }: NgxsFirestoreConnectActions.StreamDisconnected
  ) {

    console.log('firestore-plugin trying to remove stream ' + payload);

    setState(
      patch<NgxsFirestoreStateModel>({ connections: removeItem((x) => x.id === payload) })
    );
  }
}
