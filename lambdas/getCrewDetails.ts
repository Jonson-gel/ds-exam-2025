import { SNSEvent, SNSHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDocumentClient();

export const handler: SNSHandler = async (event: SNSEvent) => {
  try {
    console.log("[SNS EVENT]", JSON.stringify(event));

    for (const record of event.Records) {
      const message = JSON.parse(record.Sns.Message);
      console.log("[Parsed Message]", message);

      const { crewId, status, reason } = message;

      if (!crewId || !status) {
        console.warn("Missing crewId or status in message:", message);
        continue;
      }

      const commandInput: UpdateCommandInput = {
        TableName: process.env.TABLE_NAME!,
        Key: { crewId },
        UpdateExpression: "SET #s = :s, #r = :r",
        ExpressionAttributeNames: {
          "#s": "status",
          "#r": "reason",
        },
        ExpressionAttributeValues: {
          ":s": status,
          ":r": reason ?? null,
        },
      };

      await ddbDocClient.send(new UpdateCommand(commandInput));
      console.log(`Updated crewId ${crewId} with status=${status}, reason=${reason}`);
    }

    return;
  } catch (error: any) {
    console.error("[ERROR]", error);
    throw new Error("Failed to process SNS message.");
  }
};

function createDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = { wrapNumbers: false };
  const translateConfig = { marshallOptions, unmarshallOptions };

  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
