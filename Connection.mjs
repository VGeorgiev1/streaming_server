'use strict';

import EventEmitter from 'events'
export default class Connection extends EventEmitter {
  constructor(socket, peerId, constrains, dissconnectHandler) {
    super();
    this.state = 'open';
    this.peerId = peerId
    this.constrains = constrains
    this.socket = socket
    this.dissconnectHandler = dissconnectHandler;
  }


  close() {
    this.state = 'closed';
    this.emit('closed');
  }
  on(event, handler){
    this.socket.on(event,handler);
  }
  emit(event, data){
    this.socket.emit(event, data)
  }
}
