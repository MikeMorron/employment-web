import type { Vacancy } from "@/types/vacancy";
import { mockJobsChunk01 } from "./chunk-01";
import { mockJobsChunk02 } from "./chunk-02";
import { mockJobsChunk03 } from "./chunk-03";
import { mockJobsChunk04 } from "./chunk-04";
import { mockJobsChunk05 } from "./chunk-05";
import { mockJobsChunk06 } from "./chunk-06";
import { mockJobsChunk07 } from "./chunk-07";
import { mockJobsChunk08 } from "./chunk-08";
import { mockJobsChunk09 } from "./chunk-09";
import { mockJobsChunk10 } from "./chunk-10";
import { mockJobsChunk11 } from "./chunk-11";
import { mockJobsChunk12 } from "./chunk-12";

export const mockJobs: Vacancy[] = [
  ...mockJobsChunk01,
  ...mockJobsChunk02,
  ...mockJobsChunk03,
  ...mockJobsChunk04,
  ...mockJobsChunk05,
  ...mockJobsChunk06,
  ...mockJobsChunk07,
  ...mockJobsChunk08,
  ...mockJobsChunk09,
  ...mockJobsChunk10,
  ...mockJobsChunk11,
  ...mockJobsChunk12,
];
