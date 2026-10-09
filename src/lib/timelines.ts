import { pb } from "./dbClient";
import type { Timeline } from "@/types/index";

const fetchTimelines = async (): Promise<Timeline[]> => {
  try {
    const records = await pb.collection("timeline").getFullList<Timeline>();
    return records;
  } catch (error) {
    console.error("Error fetching timelines:", error);
    return [];
  }
};

export { fetchTimelines };
