import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.REGION;
const TABLE_NAME = process.env.TABLE_NAME!;

const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const movieId = event.pathParameters?.movieId;
  const role = event.pathParameters?.role;
  const verbose = event.queryStringParameters?.verbose === "true";

  if (!movieId || !role) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing required path parameters: role or movieId",
      }),
    };
  }

  try {
    if (verbose) {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "movieId = :movieId",
        ExpressionAttributeValues: {
          ":movieId": movieId,
        },
      });

      const result = await ddbDocClient.send(command);
      return {
        statusCode: 200,
        body: JSON.stringify({
          movieId,
          crew: result.Items || [],
        }),
      };
    } else {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          movieId,
          role,
        },
      });

      const result = await ddbDocClient.send(command);

      if (!result.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Crew member not found" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
    }
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
