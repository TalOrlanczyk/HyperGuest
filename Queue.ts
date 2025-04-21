import { Message } from "./Database";

interface InProgressMessage {
    messageId: string;
    key: string;
    workerId: number;
}

export class Queue {
    private messages: Message[]
    private processing: Map<string, InProgressMessage>

    constructor() {
        this.messages = []
        this.processing = new Map()
    }

    Enqueue = (message: Message) => {
        this.messages.push(message)
    }

    /**
     * Dequeues a message that can be processed by the worker.
     * - Allows parallel processing of different keys
     * - Prevents race conditions by locking keys during processing
     * - Returns undefined if no message is available or if all keys are locked
     */
    Dequeue = (workerId: number): Message | undefined => {
        if (this.messages.length === 0) {
            return undefined;
        }

        const messageIndex = this.messages.findIndex(
            (msg) => !this.processing.has(msg.key)
        );

        if (messageIndex === -1) {
            return undefined;
        }

        const [message] = this.messages.splice(messageIndex, 1);
        this.processing.set(message.key, {
            messageId: message.id,
            key: message.key,
            workerId
        });

        return message;
    }

    /**
     * Confirms that a message has been processed and releases its key lock
     *  
     * What I added:
     * - check if the workerId and messageId are in the processing map - if not continue as usuall, if yes delete the message from the processing map
     */
    Confirm = (workerId: number, messageId: string) => {
        for (const [key, info] of this.processing.entries()) {
            if (info.messageId === messageId) {
                if (info.workerId !== workerId) {
                    return;
                }
                this.processing.delete(key);
                return;
            }
        }
    }

    Size = () => {
        return this.messages.length + this.processing.size;
    }
}

