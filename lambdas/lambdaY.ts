import { Handler } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: "eu-west-1" });
const QUEUE_A_URL = process.env.QUEUE_A_URL!;

export const handler: Handler = async (event) => {
  console.log("Received SNS Event: ", JSON.stringify(event));

  for (const record of event.Records) {
    const snsMessage = record.Sns.Message;

    let data;
    try {
      data = JSON.parse(snsMessage);
    } catch (err) {
      console.error("Invalid JSON message:", snsMessage);
      continue;
    }

    const country = data?.address?.country;
    if (country === "Ireland" || country === "China") {
      console.log(`Forwarding message to QueueA. Country: ${country}`);
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_A_URL,
          MessageBody: JSON.stringify(data),
        })
      );
    } else {
      console.log(`Discarded message. Country not allowed: ${country}`);
    }
  }
};
