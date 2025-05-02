import { Handler } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: process.env.REGION });

export const handler: Handler = async (event, context) => {
  try {
    console.log("Received event:", JSON.stringify(event));

    for (const record of event.Records) {
      const messageBody = record.body;

      const command = new SendMessageCommand({
        QueueUrl: process.env.QUEUE_B_URL!,
        MessageBody: messageBody,
      });

      await sqsClient.send(command);
      console.log(`Forwarded message to QueueB: ${messageBody}`);
    }

  } catch (error: any) {
    console.error("Error forwarding message:", error);
    throw new Error(JSON.stringify(error));
  }
};
