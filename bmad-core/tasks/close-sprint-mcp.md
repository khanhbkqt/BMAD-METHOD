# Close Sprint Task (MCP Enhanced)

## Purpose

Systematic sprint closure process that reviews goal achievement, analyzes completed work, captures lessons learned, and prepares for the next sprint. This ensures continuous improvement and proper sprint lifecycle management.

## CRITICAL WORKFLOW RULE

**MANDATORY SPRINT CLOSURE**: Before starting a new sprint, the current sprint must be properly closed with goal assessment and retrospective analysis.

## SEQUENTIAL Task Execution (Do not proceed until current Task is complete)

### 0. Verify Current Sprint Status

**Sprint Status Check:**

1. **Get Current Sprint:** Use `bmad_get_current_sprint` to verify active sprint:
   - If no active sprint: Display message "No active sprint to close" and exit
   - If active sprint exists: Proceed with closure process

2. **Sprint Timeline Check:** Verify sprint completion:
   - Check if sprint end date has passed
   - If sprint is ending early: Ask user for reason and confirmation
   - Display current date vs planned end date

### 1. Sprint Goal Achievement Analysis

#### 1.1 Goal Assessment

**Sprint Goal Review:**

1. **Display Sprint Information:**
   ```
   🏃 SPRINT CLOSURE REVIEW 🏃
   
   Sprint: ${sprint_name}
   Goal: ${sprint_goal}
   Duration: ${start_date} to ${end_date}
   Planned Stories: ${planned_story_count}
   ```

2. **Goal Achievement Evaluation:** Ask user to assess:
   ```
   Sprint Goal Achievement Assessment:
   
   Original Goal: "${sprint_goal}"
   
   Goal Achievement Level:
   1. Fully Achieved (100%) - Goal completely met
   2. Mostly Achieved (75-99%) - Goal substantially met  
   3. Partially Achieved (50-74%) - Goal partially met
   4. Minimally Achieved (25-49%) - Goal barely met
   5. Not Achieved (0-24%) - Goal not met
   
   Please select level and provide explanation:
   ```

#### 1.2 Story Completion Analysis

**Sprint Backlog Review:**

1. **Get Sprint Tasks:** Use `bmad_query_tasks` with sprint filter:
   - Query all tasks assigned to current sprint
   - Count completed vs planned stories
   - Identify incomplete stories

2. **Completion Metrics Display:**
   ```
   📊 SPRINT COMPLETION METRICS 📊
   
   Stories Completed: ${completed_count} / ${total_count}
   Completion Rate: ${completion_percentage}%
   
   Completed Stories:
   ${list_completed_stories}
   
   Incomplete Stories:
   ${list_incomplete_stories}
   ```

3. **Incomplete Story Handling:** For each incomplete story:
   ```
   Incomplete Story: ${story_title}
   Current Status: ${current_status}
   
   Action for this story:
   1. Move to next sprint (recommended)
   2. Mark as completed (if nearly done)
   3. Cancel/remove from backlog
   4. Keep in current sprint (extend sprint)
   ```

### 2. Sprint Retrospective

#### 2.1 What Went Well

**Success Factors Analysis:**

1. **Positive Outcomes:** Ask user to identify:
   ```
   🎉 What went well in this sprint?
   
   Categories to consider:
   - Story completion and quality
   - Team collaboration and communication  
   - Process improvements and efficiency
   - Technical achievements and learnings
   - Goal alignment and focus
   
   Please list 3-5 things that went well:
   ```

2. **Success Pattern Recognition:** Help identify repeatable patterns:
   - What processes contributed to success?
   - Which practices should be continued?
   - What tools or techniques were most effective?

#### 2.2 What Could Be Improved

**Improvement Opportunities:**

1. **Challenge Analysis:** Ask user to identify:
   ```
   🔧 What could be improved for next sprint?
   
   Categories to consider:
   - Sprint planning and estimation
   - Story definition and clarity
   - Development process and workflow
   - Communication and coordination
   - Technical debt and quality
   
   Please list 3-5 improvement opportunities:
   ```

2. **Root Cause Analysis:** For each improvement area:
   - What was the underlying cause?
   - How can this be prevented in future sprints?
   - What specific actions should be taken?

#### 2.3 Action Items for Next Sprint

**Continuous Improvement Planning:**

1. **Improvement Actions:** Create specific, actionable items:
   ```
   🎯 Actions for Next Sprint:
   
   Based on retrospective analysis:
   1. [Specific action item 1]
   2. [Specific action item 2]  
   3. [Specific action item 3]
   
   Process Changes:
   - [Process change 1]
   - [Process change 2]
   
   Tools/Techniques to Try:
   - [New tool/technique 1]
   - [New tool/technique 2]
   ```

### 3. Sprint Metrics and Learning Capture

#### 3.1 Sprint Velocity Calculation

**Performance Metrics:**

1. **Calculate Sprint Velocity:** Use completion data:
   ```
   📈 SPRINT VELOCITY METRICS 📈
   
   Stories Completed: ${completed_stories}
   Sprint Duration: ${duration_weeks} weeks
   Sprint Velocity: ${stories_per_week} stories/week
   
   Historical Comparison:
   Previous Sprint Velocity: ${previous_velocity}
   Velocity Change: ${velocity_change} (+/- ${percentage}%)
   ```

2. **Velocity Trend Analysis:**
   - Is velocity increasing, decreasing, or stable?
   - What factors influenced velocity changes?
   - What does this suggest for future sprint planning?

#### 3.2 Documentation Creation

**Sprint Closure Documentation:**

1. **Create Sprint Review Document:** Use `bmad_create_document`:
   ```json
   {
     "type": "sprint-review",
     "title": "Sprint ${sprint_num} Review - ${sprint_name}",
     "content": {
       "sprint_info": {
         "name": "${sprint_name}",
         "goal": "${sprint_goal}",
         "duration": "${start_date} to ${end_date}"
       },
       "goal_achievement": {
         "level": "${achievement_level}",
         "explanation": "${achievement_explanation}"
       },
       "completion_metrics": {
         "planned_stories": ${planned_count},
         "completed_stories": ${completed_count},
         "completion_rate": "${completion_percentage}%",
         "velocity": "${sprint_velocity}"
       },
       "retrospective": {
         "went_well": ["${item1}", "${item2}", "${item3}"],
         "improvements": ["${item1}", "${item2}", "${item3}"],
         "action_items": ["${action1}", "${action2}"]
       },
       "incomplete_stories": ["${story1}", "${story2}"],
       "lessons_learned": "${lessons_text}"
     }
   }
   ```

### 4. Sprint Status Update and Closure

#### 4.1 Handle Incomplete Stories

**Story Transition Management:**

1. **Process Incomplete Stories:** For each incomplete story:
   - Update story status if moving to next sprint
   - Add notes explaining why story wasn't completed
   - Estimate remaining effort for next sprint planning

2. **Use MCP Tools for Updates:**
   ```json
   bmad_update_task_status:
   {
     "task_id": "${story_id}",
     "status": "TODO",
     "notes": "Moved from Sprint ${current_sprint} - ${reason}",
     "sprint_id": null
   }
   ```

#### 4.2 Close Sprint Officially

**Sprint Closure Process:**

1. **Update Sprint Status:** Use `bmad_update_sprint_status`:
   ```json
   {
     "sprint_id": "${current_sprint_id}",
     "status": "COMPLETED",
     "end_date": "${actual_end_date}",
     "goal_achievement": "${achievement_level}",
     "completion_rate": "${completion_percentage}%",
     "velocity": "${sprint_velocity}",
     "lessons_learned": "${retrospective_summary}"
   }
   ```

2. **Verify Closure:** Use `bmad_get_current_sprint` to confirm:
   - Sprint status changed to COMPLETED
   - No longer shows as current/active sprint
   - All data properly recorded

### 5. Next Sprint Preparation

#### 5.1 Learning Integration

**Apply Lessons Learned:**

1. **Update Sprint Process:** Based on retrospective:
   - Adjust story estimation techniques
   - Modify sprint planning approach
   - Update definition of done if needed
   - Refine communication practices

2. **Capacity Planning for Next Sprint:**
   - Use current sprint velocity for estimation
   - Account for team availability changes
   - Consider process improvements impact
   - Plan for technical debt reduction

#### 5.2 Backlog Preparation

**Next Sprint Setup:**

1. **Backlog Refinement:** Prepare for next sprint:
   - Move incomplete stories to backlog
   - Prioritize stories based on current sprint learnings
   - Estimate new stories using updated velocity data
   - Identify dependencies and risks

2. **Sprint Planning Readiness:**
   ```
   🚀 READY FOR NEXT SPRINT PLANNING 🚀
   
   Current Status:
   ✅ Sprint ${current_sprint} closed successfully
   ✅ Lessons learned documented
   ✅ Incomplete stories moved to backlog
   ✅ Sprint velocity calculated: ${velocity}
   
   Next Sprint Recommendations:
   - Target Velocity: ${recommended_velocity} stories
   - Focus Areas: ${focus_areas}
   - Process Improvements: ${improvements}
   
   Ready to run: *start-sprint command
   ```

### 6. Sprint Closure Summary

#### 6.1 Final Sprint Report

**Comprehensive Sprint Summary:**

```
🏁 SPRINT ${sprint_num} CLOSURE COMPLETE 🏁

Sprint Overview:
• Name: ${sprint_name}
• Goal: ${sprint_goal}
• Duration: ${duration} (${start_date} to ${end_date})

Achievement Summary:
• Goal Achievement: ${achievement_level}
• Stories Completed: ${completed_count}/${planned_count} (${completion_rate}%)
• Sprint Velocity: ${velocity} stories/week

Key Outcomes:
• Deliverables: ${key_deliverables}
• Technical Achievements: ${technical_wins}
• Process Learnings: ${process_insights}

Next Steps:
• Action Items: ${action_count} items for next sprint
• Process Changes: ${process_changes}
• Backlog Ready: ${backlog_ready_count} stories

Status: ✅ Sprint Officially Closed
Next: Ready for new sprint planning
```

## Integration with Sprint Lifecycle

### Workflow Enforcement

After sprint closure:
1. **Block Story Creation:** Until new sprint starts, prevent story creation
2. **Update Task Board:** Clear current sprint filter, show "No Active Sprint" 
3. **Update Dashboard:** Show sprint completion metrics
4. **Prepare Planning:** Make retrospective data available for next sprint planning

### Continuous Improvement Loop

1. **Velocity Tracking:** Each closed sprint contributes to velocity history
2. **Pattern Recognition:** Multiple sprint retrospectives reveal systemic issues
3. **Process Evolution:** Sprint closure insights drive workflow improvements
4. **Quality Metrics:** Track goal achievement rates over multiple sprints

## MCP Tools Reference

### Required Tools:
- `bmad_get_current_sprint` - Get active sprint information
- `bmad_query_tasks` - Get sprint tasks and completion status
- `bmad_update_sprint_status` - Close sprint and record outcomes
- `bmad_update_task_status` - Handle incomplete stories
- `bmad_create_document` - Store sprint review and retrospective
- `bmad_get_sprint_history` - Access previous sprint data for comparison

### Sprint Closure Resources:
- `bmad://sprints/current/review` - Current sprint review data
- `bmad://sprints/history` - All completed sprints for velocity trends
- `bmad://project/velocity` - Project velocity trends and patterns
- `bmad://retrospectives/all` - All retrospective data for pattern analysis

## Success Criteria for Sprint Closure

1. **Complete Goal Assessment:** Clear evaluation of goal achievement
2. **Thorough Retrospective:** Honest analysis of what worked and what didn't
3. **Actionable Improvements:** Specific items to implement in next sprint
4. **Clean Story Transition:** All incomplete stories properly handled
5. **Accurate Documentation:** Complete sprint record for future reference
6. **Velocity Calculation:** Reliable data for future sprint planning
7. **Team Learning:** Captured insights that improve future performance

This systematic approach to sprint closure ensures that each sprint contributes to continuous improvement and that the team learns from both successes and challenges.