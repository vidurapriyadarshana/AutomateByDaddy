/**
 * Job Queue - Simple in-memory job queue for MVP
 * For production, use Bull, BullMQ, or RabbitMQ
 */

export type JobType = "send_email" | "send_whatsapp";

export interface Job<T = any> {
  id: string;
  type: JobType;
  data: T;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: {
    orderId?: bigint;
    paymentId?: bigint;
    eventType?: string;
  };
}

export interface WhatsAppJobData {
  to: string;
  message: string;
  metadata?: {
    orderId?: bigint;
    customerId?: bigint;
    eventType?: string;
  };
}

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private workerMap: Map<JobType, (job: Job) => Promise<void>> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Register a worker for a job type
   */
  registerWorker(type: JobType, handler: (job: Job) => Promise<void>) {
    this.workerMap.set(type, handler);
  }

  /**
   * Add a job to the queue
   */
  async addJob(type: JobType, data: any): Promise<string> {
    const jobId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: Job = {
      id: jobId,
      type,
      data,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: "pending",
    };

    this.jobs.set(jobId, job);

    // eslint-disable-next-line no-console
    console.log(`[Queue] Job added: ${jobId}`);

    // Start processing if not already running
    if (!this.processingInterval) {
      this.startProcessing();
    }

    return jobId;
  }

  /**
   * Start processing jobs
   */
  private startProcessing() {
    this.processingInterval = setInterval(async () => {
      await this.processNextJob();
    }, 1000); // Process every 1 second

    // eslint-disable-next-line no-console
    console.log("[Queue] Job processing started");
  }

  /**
   * Stop processing jobs
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      // eslint-disable-next-line no-console
      console.log("[Queue] Job processing stopped");
    }
  }

  /**
   * Process next job in queue
   */
  private async processNextJob() {
    // Find first pending job
    const job = Array.from(this.jobs.values()).find((j) => j.status === "pending");

    if (!job) {
      return;
    }

    // Get worker for this job type
    const worker = this.workerMap.get(job.type);
    if (!worker) {
      job.status = "failed";
      job.error = `No worker registered for job type: ${job.type}`;
      // eslint-disable-next-line no-console
      console.error(`[Queue] ${job.error}`);
      return;
    }

    try {
      job.status = "processing";
      job.attempts += 1;

      // eslint-disable-next-line no-console
      console.log(`[Queue] Processing job: ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

      await worker(job);

      job.status = "completed";
      // eslint-disable-next-line no-console
      console.log(`[Queue] Job completed: ${job.id}`);
    } catch (error: any) {
      job.error = error.message;

      if (job.attempts >= job.maxAttempts) {
        job.status = "failed";
        // eslint-disable-next-line no-console
        console.error(
          `[Queue] Job failed after ${job.maxAttempts} attempts: ${job.id}`,
          error,
        );
      } else {
        job.status = "pending";
        // eslint-disable-next-line no-console
        console.warn(
          `[Queue] Job retry: ${job.id} (will retry, attempt ${job.attempts}/${job.maxAttempts})`,
        );
      }
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get queue stats
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
    };
  }

  /**
   * Clean up completed/failed jobs older than retention period
   */
  cleanup(retentionMs: number = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - retentionMs;
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.createdAt.getTime() < cutoff
      ) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      // eslint-disable-next-line no-console
      console.log(`[Queue] Cleaned up ${cleaned} old jobs`);
    }
  }
}

// Export singleton instance
export const jobQueue = new JobQueue();
