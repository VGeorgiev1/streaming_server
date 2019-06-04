'use strict';

import EventEmitter from 'events'
export default class Connection extends EventEmitter {
  constructor(socket, peerId, constrains,properties, disconnectHandler) {
    super();
    this.state = 'open';
    this.peerId = peerId
    this.constrains = constrains
    this.socket = socket
    this.properties = properties
    this.disconnectHandler = disconnectHandler;
  }

  on(event, handler){
    this.socket.on(event,handler);
  }
  emit(event, data){
    this.socket.emit(event, data)
  }
}
