import mongoose, { Document, Schema, Types } from 'mongoose';

export type JobStatus = 'applied' | 'interviewing' | 'offer' | 'rejected' | 'stale';
export type LocationType = 'remote' | 'onsite' | 'hybrid';

export interface IJob extends Document {
  user: Types.ObjectId;
  title: string;
  company: string;
  location?: LocationType;
  salary?: string;
  applicationDate: Date;
  status: JobStatus;
  noticePeriod?: string;
  description?: string;
  jobLink?: string;
  tags: string[];
  followUpSent: boolean;
  followUpDate?: Date;
  timeoutDays: number;
  isStale: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 100 },
    location: { type: String, enum: ['remote', 'onsite', 'hybrid'] },
    salary: { type: String, trim: true },
    applicationDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['applied', 'interviewing', 'offer', 'rejected', 'stale'],
      default: 'applied',
      index: true,
    },
    noticePeriod: { type: String, trim: true },
    description: { type: String },
    jobLink: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    followUpSent: { type: Boolean, default: false },
    followUpDate: { type: Date },
    timeoutDays: { type: Number, default: 14, min: 1, max: 365 },
    isStale: { type: Boolean, default: false, index: true },
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

jobSchema.index({ user: 1, status: 1 });
jobSchema.index({ user: 1, applicationDate: -1 });
jobSchema.index({ user: 1, isStale: 1, status: 1 });

jobSchema.pre('save', function () {
  (this as IJob).lastActivityAt = new Date();
});

jobSchema.pre('findOneAndUpdate', function () {
  this.set({ lastActivityAt: new Date() });
});

export default mongoose.model<IJob>('Job', jobSchema);
