import { NextResponse, type NextRequest } from "next/server";

import { z } from "zod";

import { db } from "@/db";
import { tweetsTable } from "@/db/schema";

// zod is a library that helps us validate data at runtime
// it's useful for validating data coming from the client,
// since typescript only validates data at compile time.
// zod's schema syntax is pretty intuitive,
// read more about zod here: https://zod.dev/
const postTweetRequestSchema = z.object({
  userId: z.number(),
  content: z.string().min(1).max(280),
  timestart: z.number().optional(),
  timeend: z.number().optional(),
  replyToTweetId: z.number().positive().optional(),
});

// you can use z.infer to get the typescript type from a zod schema
export type PostTweetRequest = z.infer<typeof postTweetRequestSchema>;

// This API handler file would be trigger by http requests to /api/tweets
// POST requests would be handled by the POST function
// GET requests would be handled by the GET function
// etc.
// read more about Next.js API routes here:
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers
export async function POST(request: NextRequest) {

  const data = await request.json();

  try {
    // parse will throw an error if the data doesn't match the schema
    postTweetRequestSchema.parse(data);
  } catch (error) {
    // in case of an error, we return a 400 response
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Now we can safely use the data from the request body
  // the `as` keyword is a type assertion, this tells typescript
  // that we know what we're doing and that the data is of type LikeTweetRequest.
  // This is safe now because we've already validated the data with zod.

  try {
    // This piece of code runs the following SQL query:
    // INSERT INTO tweets (
    //  user_handle,
    //  content,
    //  reply_to_tweet_id
    // ) VALUES (
    //  {handle},
    //  {content},
    //  {replyToTweetId}
    // )
    const { userId, content, timestart, timeend, replyToTweetId } = data as PostTweetRequest;
    const tweetid = await db
      .insert(tweetsTable)
      .values({
        content,
        userId,
        timestart,
        timeend,
        replyToTweetId
      })
      .returning({ id: tweetsTable.id })
      .execute();
    return NextResponse.json({ data: tweetid }, { status: 200 });
  } catch (error) {
    // The NextResponse object is a easy to use API to handle responses.
    // IMHO, it's more concise than the express API.
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
