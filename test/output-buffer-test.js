import chai    from 'chai';
import Manager from '../src/wizards-duel/manager.js';
import OutputBuffer  from '../src/wizards-duel/output-buffer.js';
import sinon from 'sinon';
import 'sinon-chai';

var expect = chai.expect;

describe('OutputBuffer', () => {
	var response;
	var outputBuffer;
	var messages = [
		'Let\'s get down to business to defeat the Huns.',
		'Did they send me daughters when I asked for sons?',
		'You\'re the saddest bunch I ever met, but you can bet before we\'re through...',
	];

	beforeEach(() => {
		response = {
			send: function() {},
			reply: function() {},
		};

		outputBuffer = new OutputBuffer(response);
	});

	it('it stores messages in order', () => {
		outputBuffer.send(messages[0]);
		outputBuffer.send(messages[1]);
		outputBuffer.send(messages[2]);

		expect(outputBuffer.messages).to.deep.eql([
			{
				type: OutputBuffer.MESSAGE_SEND,
				content: messages[0],
			},
			{
				type: OutputBuffer.MESSAGE_SEND,
				content: messages[1],
			},
			{
				type: OutputBuffer.MESSAGE_SEND,
				content: messages[2],
			},
		]);
	});

	it('it builds messages through #append', () => {
		outputBuffer.startMessage();
		outputBuffer.append(messages[0]);
		outputBuffer.append(messages[1]);
		outputBuffer.append(messages[2]);
		outputBuffer.endMessage();

		expect(outputBuffer.messages[0].content).to.eql(messages[0] + messages[1] + messages[2]);
	});

	it('it starts a new message from #append if one is not started', () => {
		outputBuffer.append(messages[0]);
		outputBuffer.append(messages[1]);
		outputBuffer.append(messages[2]);
		outputBuffer.endMessage();

		expect(outputBuffer.messages[0].content).to.eql(messages[0] + messages[1] + messages[2]);
	});

	it('#startSend and #endSend work', () => {
		outputBuffer.startSend();
		outputBuffer.append(messages[0]);
		outputBuffer.endSend();
		outputBuffer.send(messages[1]);

		expect(outputBuffer.messages[0]).to.deep.eql({
			type: OutputBuffer.MESSAGE_SEND,
			content: messages[0],
		});

		expect(outputBuffer.messages[1]).to.deep.eql({
			type: OutputBuffer.MESSAGE_SEND,
			content: messages[1],
		});
	});

	it('#startReply and #endReply work', () => {
		outputBuffer.startReply();
		outputBuffer.append(messages[0]);
		outputBuffer.endReply();
		outputBuffer.send(messages[1]);

		expect(outputBuffer.messages[0]).to.deep.eql({
			type: OutputBuffer.MESSAGE_REPLY,
			content: messages[0],
		});

		expect(outputBuffer.messages[1]).to.deep.eql({
			type: OutputBuffer.MESSAGE_SEND,
			content: messages[1],
		});
	});

	it('#flush calls the correct response functions', () => {
		var sendSpy  = sinon.spy(response, 'send');
		var replySpy = sinon.spy(response, 'reply');

		outputBuffer.send(messages[0]);
		outputBuffer.reply(messages[1]);
		outputBuffer.send(messages[2]);
		outputBuffer.flush();

		expect(sendSpy.callCount).to.eql(2);
		expect(replySpy.callCount).to.eql(1);
	});

});
