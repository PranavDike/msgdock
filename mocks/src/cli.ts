import { MockMessageService } from './server.js';

const service = new MockMessageService();
const response = await service.listMessages();

console.log(JSON.stringify(response, null, 2));
