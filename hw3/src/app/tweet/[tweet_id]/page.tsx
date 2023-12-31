import Link from "next/link";
import { redirect } from "next/navigation";

import { eq, asc, sql, and } from "drizzle-orm";
import {
  ChevronLeft
} from "lucide-react";

import LikeButton from "@/components/LikeButton";
import ReplyInput from "@/components/ReplyInput";
import TimeDisplay from "@/components/TimeDisplay";
import Tweet from "@/components/Tweet";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { likesTable, tweetsTable, usersTable } from "@/db/schema";

type TweetPageProps = {
  params: {
    // this came from the file name: [tweet_id].tsx
    tweet_id: string;
  };
  searchParams: {
    // this came from the query string: ?username=madmaxieee
    username: string;
    userid: number;
  };
};

// these two fields are always available in the props object of a page component
export default async function TweetPage({
  params: { tweet_id },
  searchParams: { username, userid },
}: TweetPageProps) {

  // this function redirects to the home page when there is an error
  const errorRedirect = () => {
    const params = new URLSearchParams();
    username && params.set("username", username);
    redirect(`/?${params.toString()}`);
  };

  // if the tweet_id can not be turned into a number, redirect to the home page
  const tweet_id_num = parseInt(tweet_id);
  if (isNaN(tweet_id_num)) {
    errorRedirect();
  }

  // This is the easiest way to get the tweet data
  // you can run separate queries for the tweet data, likes, and liked
  // and then combine them in javascript.
  //
  // This gets things done for now, but it's not the best way to do it
  // relational databases are highly optimized for this kind of thing
  // we should always try to do as much as possible in the database.

  // This piece of code runs the following SQL query on the tweets table:
  // SELECT
  //   id,
  //   content,
  //   user_handle,
  //   created_at
  //   FROM tweets
  //   WHERE id = {tweet_id_num};
  const [tweetData] = await db
    .select({
      id: tweetsTable.id,
      userId: tweetsTable.userId,
      content: tweetsTable.content,
      timestart: tweetsTable.timestart,
      timeend: tweetsTable.timeend,
      createdAt: tweetsTable.createdAt,
    })
    .from(tweetsTable)
    .where(eq(tweetsTable.id, tweet_id_num))
    .execute();

  // Although typescript thinks tweetData is not undefined, it is possible
  // that tweetData is undefined. This can happen if the tweet doesn't exist.
  // Thus the destructuring assignment above is not safe. We need to check
  // if tweetData is undefined before using it.
  if (!tweetData) {
    errorRedirect();
  }

  // This piece of code runs the following SQL query on the tweets table:
  // SELECT
  //  id,
  //  FROM likes
  //  WHERE tweet_id = {tweet_id_num};
  // Since we only need the number of likes, we don't actually need to select
  // the id here, we can select a constant 1 instead. Or even better, we can
  // use the count aggregate function to count the number of rows in the table.
  // This is what we do in the next code block in likesSubquery.
  const likes = await db
    .select({
      id: likesTable.id,
    })
    .from(likesTable)
    .where(eq(likesTable.tweetId, tweet_id_num))
    .execute();

  const numLikes = likes.length;

  const [liked] = await db
    .select({
      id: likesTable.id,
    })
    .from(likesTable)
    .where(
      and(
        eq(likesTable.tweetId, tweet_id_num),
        eq(likesTable.userId, userid),
      ),
    )
    .execute();

  const [user] = await db
    .select({
      id: usersTable.id,
      displayName: usersTable.displayName,
    })
    .from(usersTable)
    .where(eq(usersTable.id, tweetData.userId))
    .execute();

  const tweet = {
    id: tweetData.id,
    content: tweetData.content,
    timestart: tweetData.timestart,
    timeend: tweetData.timeend,
    username: user.displayName,
    userid: user.id,
    likes: numLikes,
    createdAt: tweetData.createdAt,
    liked: Boolean(liked),
  };

  // The following code is almost identical to the code in src/app/page.tsx
  // read the comments there for more info.
  const likesSubquery = db.$with("likes_count").as(
    db
      .select({
        tweetId: likesTable.tweetId,
        likes: sql<number | null>`count(*)`.mapWith(Number).as("likes"),
      })
      .from(likesTable)
      .groupBy(likesTable.tweetId),
  );

  const likedSubquery = db.$with("liked").as(
    db
      .select({
        tweetId: likesTable.tweetId,
        liked: sql<number>`1`.mapWith(Boolean).as("liked"),
      })
      .from(likesTable)
      .where(eq(likesTable.userId, userid)),
  );

  const replies = await db
    .with(likesSubquery, likedSubquery)
    .select({
      id: tweetsTable.id,
      content: tweetsTable.content,
      replyToTweetId: tweetsTable.replyToTweetId,
      username: usersTable.displayName,
      userid: usersTable.id,
      likes: likesSubquery.likes,
      createdAt: tweetsTable.createdAt,
      liked: likedSubquery.liked,
    })
    .from(tweetsTable)
    .where(eq(tweetsTable.replyToTweetId, tweet_id_num))
    .orderBy(asc(tweetsTable.createdAt))
    .innerJoin(usersTable, eq(tweetsTable.userId, usersTable.id))
    .leftJoin(likesSubquery, eq(tweetsTable.id, likesSubquery.tweetId))
    .leftJoin(likedSubquery, eq(tweetsTable.id, likedSubquery.tweetId))
    .execute();

  return (
    <>
      <div className="flex h-screen w-full max-w-2xl flex-col overflow-scroll pt-2">
        <div className="mb-2 flex items-center gap-8 px-4">
          <Link href={{ pathname: "/", query: { username, userid } }}>
            <ChevronLeft size={18} />
          </Link>
        </div>
        <div className="flex flex-col px-4 pt-3">
          <article className="mt-3 whitespace-pre-wrap text-xl">
            {tweet.content}
            <div className="my-4 block font-large text-sky-400">
              {tweet.likes} people are participating.
            </div>
          </article>
          <time className="my-4 block font-normal text-gray-500">
            {tweet.timestart && tweet.timeend && (
              <TimeDisplay 
                timestart={tweet.timestart}
                timeend={tweet.timeend}
              />
            )} 
          </time>
          <Separator />
          <div className="my-2 flex items-center justify-between gap-4 text-gray-400">
            <LikeButton
              userId={parseInt(userid.toString())}
              initialLiked={tweet.liked}
              tweetId={tweet.id}
            />
          </div>
          {tweet.liked && <Separator />}
        </div>
        <ReplyInput replyToTweetId={tweet.id} likeState={tweet.liked}/>
        <Separator />
        {replies.map((reply) => (
          <Tweet
            key={reply.id}
            id={reply.id}
            username={username}
            userid={userid}
            authorName={reply.username}
            content={reply.content}
            timestart={null}
            timeend={null}
            likes={reply.likes}
            liked={reply.liked}
            createdAt={reply.createdAt!}
            state={false}
          />
        ))}
      </div>
    </>
  );
}
