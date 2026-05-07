#!/usr/bin/env node

/**
 * Team Collaboration Features
 * Component review workflow, comments, approval process, and activity feed.
 */

const fs = require('fs').promises;
const path = require('path');

class TeamCollaboration {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.collabDir = path.join(this.projectDir, '.collaboration');
    this.reviewsFile = path.join(this.collabDir, 'reviews.json');
    this.commentsFile = path.join(this.collabDir, 'comments.json');
    this.activityFile = path.join(this.collabDir, 'activity.json');
  }

  async init() {
    console.log('👥 Initializing Team Collaboration...');
    await fs.mkdir(this.collabDir, { recursive: true });
    await this.createConfig();
    console.log('✅ Team Collaboration initialized!');
  }

  async createConfig() {
    const config = {
      requireApproval: true,
      reviewers: [],
      autoAssign: false,
      notificationChannels: []
    };
    await fs.writeFile(path.join(this.collabDir, 'config.json'), JSON.stringify(config, null, 2));
  }

  async requestReview(componentName, reviewer) {
    console.log(`📋 Requesting review for ${componentName} from ${reviewer}`);
    const reviews = await this.loadReviews();
    reviews[componentName] = {
      status: 'pending',
      reviewer,
      requestedAt: new Date().toISOString(),
      comments: []
    };
    await fs.writeFile(this.reviewsFile, JSON.stringify(reviews, null, 2));
    await this.logActivity('review_requested', componentName, { reviewer });
    console.log('✅ Review requested');
  }

  async addComment(componentName, comment, author) {
    console.log(`💬 Adding comment to ${componentName}`);
    const comments = await this.loadComments();
    if (!comments[componentName]) comments[componentName] = [];
    comments[componentName].push({
      text: comment,
      author,
      timestamp: new Date().toISOString()
    });
    await fs.writeFile(this.commentsFile, JSON.stringify(comments, null, 2));
    await this.logActivity('comment_added', componentName, { author });
    console.log('✅ Comment added');
  }

  async approve(componentName, reviewer) {
    console.log(`✅ Approving ${componentName}`);
    const reviews = await this.loadReviews();
    if (reviews[componentName]) {
      reviews[componentName].status = 'approved';
      reviews[componentName].approvedAt = new Date().toISOString();
      reviews[componentName].approvedBy = reviewer;
    }
    await fs.writeFile(this.reviewsFile, JSON.stringify(reviews, null, 2));
    await this.logActivity('component_approved', componentName, { reviewer });
    console.log('✅ Component approved');
  }

  async loadReviews() {
    try {
      const content = await fs.readFile(this.reviewsFile, 'utf8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  async loadComments() {
    try {
      const content = await fs.readFile(this.commentsFile, 'utf8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  async logActivity(type, component, metadata = {}) {
    const activities = await this.loadActivity();
    activities.unshift({
      type,
      component,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    await fs.writeFile(this.activityFile, JSON.stringify(activities.slice(0, 100), null, 2));
  }

  async loadActivity() {
    try {
      const content = await fs.readFile(this.activityFile, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
}

module.exports = TeamCollaboration;