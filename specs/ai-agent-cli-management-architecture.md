# AI Agent CLI Management Architecture
## The 5 Key Innovations Behind Vibe-Kanban's Multi-Agent System

### Executive Summary

Vibe-Kanban implements a breakthrough architecture for managing multiple AI coding agents (Claude Code, Gemini CLI, etc.) simultaneously with real-time output streaming. This document focuses on the **5 critical innovations** that make this system unique and provides practical guidance for implementing similar patterns.

**The Core Problem Solved**: How do you run multiple AI coding agents on the same codebase concurrently without conflicts, while streaming their CLI output to a web interface in real-time?

**The Solution**: A combination of git worktrees for isolation, broadcast streaming for real-time updates, and zero-cost polymorphism for agent extensibility.

---

## Innovation 1: Git Worktrees as Lightweight Isolation

**The Insight**: Instead of heavyweight containers or VMs, use git worktrees to provide complete file system isolation with minimal overhead.

### Why This Matters
- **True Concurrency**: Multiple agents can modify the same project simultaneously
- **Git-Native**: Leverages git's built-in isolation without external dependencies
- **Lightweight**: No container overhead, just separate working directories
- **Change Tracking**: Natural diff and merge capabilities

### Implementation Deep Dive

```rust
// crates/services/src/services/worktree_manager.rs:40-100

pub struct WorktreeManager;

impl WorktreeManager {
    pub async fn create_worktree(
        repo_path: &Path,
        branch_name: &str,
        worktree_path: &Path,
        base_branch: Option<&str>,
        create_branch: bool,
    ) -> Result<(), WorktreeError> {
        // Critical: Race condition protection via global locks
        let path_str = worktree_path.to_string_lossy().to_string();
        let lock = get_or_create_worktree_lock(&path_str);
        let _guard = lock.lock().await;
        
        if create_branch {
            // Create dedicated branch for this worktree
            tokio::task::spawn_blocking(move || {
                let repo = Repository::open(&repo_path_owned)?;
                repo.branch(&branch_name_owned, &base_reference.peel_to_commit()?, false)?;
            }).await??;
        }
        
        Self::ensure_worktree_exists(repo_path, branch_name, worktree_path).await
    }
}
```

### Key Design Decisions

1. **Global Synchronization**: Uses lazy_static locks to prevent race conditions during worktree creation
2. **Branch Isolation**: Each execution gets its own branch to prevent conflicts
3. **Automatic Cleanup**: Orphaned worktrees are automatically detected and cleaned up
4. **Path Management**: Deterministic worktree paths based on task IDs

### Usage Pattern
```rust
// Each agent execution gets isolated environment
let worktree_path = format!("/tmp/vibe-worktrees/task-{}", task_id);
WorktreeManager::create_worktree(
    &project.git_repo_path,
    &format!("task-{}", task_id),
    &PathBuf::from(&worktree_path),
    Some("main"),
    true
).await?;

// Agent executes in complete isolation
let child = agent.spawn(&PathBuf::from(&worktree_path), prompt).await?;
```

---

## Innovation 2: MsgStore Broadcast Pattern for Real-time Streaming

**The Insight**: Solve the "late joiner problem" by combining historical replay with live streaming using broadcast channels.

### The Architecture

```rust
// crates/utils/src/msg_store.rs

pub struct MsgStore {
    // Complete message history for replay
    history: Arc<RwLock<Vec<LogMsg>>>,
    // Live broadcast for new messages
    sender: broadcast::Sender<LogMsg>,
}

impl MsgStore {
    // The magic: history + live stream combined
    pub fn history_plus_stream(&self) -> impl Stream<Item = Result<LogMsg, BroadcastStreamError>> {
        let history = self.get_history();
        let live_stream = BroadcastStream::new(self.sender.subscribe());
        
        // First send all history, then stream new messages
        futures::stream::iter(history.into_iter().map(Ok))
            .chain(live_stream.skip_while(|msg| {
                // Skip duplicates between history and live stream
                futures::future::ready(matches!(msg, Ok(LogMsg::Finished)))
            }))
    }
    
    // Web clients get SSE-compatible stream
    pub fn sse_stream(&self) -> BoxStream<'static, Result<Event, std::io::Error>> {
        self.history_plus_stream()
            .map_ok(|msg| msg.to_sse_event())
            .boxed()
    }
}
```

### Why This Pattern Works

1. **No Message Loss**: Late-joining clients get full context immediately
2. **Real-time Updates**: New messages stream instantly via broadcast
3. **Memory Efficient**: History is bounded, old messages can be persisted
4. **Disconnect Resilient**: Clients can reconnect and get full context

### SSE Endpoint Implementation
```rust
// crates/server/src/routes/execution_processes.rs:44-57

pub async fn stream_raw_logs(
    State(deployment): State<DeploymentImpl>,
    Path(exec_id): Path<Uuid>,
) -> Result<Sse<impl Stream<Item = Result<Event, BoxError>>>, StatusCode> {
    let stream = deployment
        .container()
        .stream_raw_logs(&exec_id)
        .await
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Sse::new(stream.map_err(|e| -> BoxError { e.into() }))
        .keep_alive(KeepAlive::default()))
}
```

---

## Innovation 3: Zero-Cost Agent Polymorphism with Enum Dispatch

**The Insight**: Use enum dispatch instead of trait objects to achieve polymorphism without runtime overhead.

### The Pattern
```rust
// crates/executors/src/executors/mod.rs:46-56

#[enum_dispatch]  // This macro generates optimal match statements
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
pub enum CodingAgent {
    ClaudeCode,
    Amp,
    Gemini,
    Codex,
    Opencode,
    Cursor,
}

#[async_trait]
#[enum_dispatch(CodingAgent)]  // All variants implement this trait
pub trait StandardCodingAgentExecutor {
    async fn spawn(&self, current_dir: &PathBuf, prompt: &str) -> Result<AsyncGroupChild, ExecutorError>;
    async fn spawn_follow_up(&self, current_dir: &PathBuf, prompt: &str, session_id: &str) -> Result<AsyncGroupChild, ExecutorError>;
    fn normalize_logs(&self, raw_logs_event_store: Arc<MsgStore>, worktree_path: &PathBuf);
}
```

### Performance Benefits
- **Zero Runtime Cost**: Compiles to direct function calls, not virtual dispatch
- **Type Safety**: All agents must implement the same interface
- **Serializable**: Can be stored/transmitted as JSON
- **Pattern Matching**: Enables agent-specific logic where needed

### Agent Selection Pattern
```rust
impl CodingAgent {
    pub fn from_profile_variant_label(
        profile_variant_label: &ProfileVariantLabel,
    ) -> Result<Self, ExecutorError> {
        // Runtime agent selection based on configuration
        let profile_config = ProfileConfigs::get_cached().get_profile(&profile_variant_label.profile)?;
        let variant = profile_config.get_variant(&profile_variant_label.variant)?;
        Ok(variant.agent.clone())  // Zero-cost clone due to enum dispatch
    }
}
```

---

## Innovation 4: Dual-Track Log Processing (Raw + Normalized)

**The Insight**: Preserve raw CLI output while extracting semantic meaning through agent-specific processors.

### The Dual Architecture

1. **Raw Logs**: Exact CLI output preserved for debugging
2. **Normalized Logs**: Structured, semantic interpretation for UI display

```rust
// Different agents need different parsing strategies

// Claude Code: Structured JSON output
impl StandardCodingAgentExecutor for ClaudeCode {
    fn normalize_logs(&self, msg_store: Arc<MsgStore>, current_dir: &PathBuf) {
        // Parse structured JSON output from Claude CLI
        ClaudeLogProcessor::process_logs(self, msg_store.clone(), current_dir, entry_index_provider);
        // Also process stderr using standard processor
        normalize_stderr_logs(msg_store, entry_index_provider);
    }
}

// Gemini: Plain text output
impl StandardCodingAgentExecutor for Gemini {
    fn normalize_logs(&self, msg_store: Arc<MsgStore>, worktree_path: &PathBuf) {
        // Use generic plain text processor with custom formatting
        let mut processor = PlainTextLogProcessor::builder()
            .normalized_entry_producer(Box::new(|content| NormalizedEntry {
                entry_type: NormalizedEntryType::AssistantMessage,
                content,
                // ... other fields
            }))
            .format_chunk(Box::new(|partial_line, chunk| {
                Self::format_stdout_chunk(&chunk, partial_line.unwrap_or(""))
            }))
            .build();
    }
}
```

### Claude JSON Processing Deep Dive
```rust
// crates/executors/src/executors/claude.rs:164-264

struct ClaudeLogProcessor {
    model_name: Option<String>,
}

impl ClaudeLogProcessor {
    fn process_logs(
        executor: &ClaudeCode,
        msg_store: Arc<MsgStore>,
        current_dir: &PathBuf,
        entry_index_provider: EntryIndexProvider,
    ) {
        tokio::spawn(async move {
            let mut stream = msg_store.history_plus_stream();
            let mut buffer = String::new();
            
            while let Some(Ok(msg)) = stream.next().await {
                let chunk = match msg {
                    LogMsg::Stdout(x) => x,
                    _ => continue,
                };
                
                buffer.push_str(&chunk);
                
                // Process complete JSON lines
                for line in buffer.split_inclusive('\n') {
                    if let Ok(claude_json) = serde_json::from_str::<ClaudeJson>(line.trim()) {
                        // Extract session ID for follow-ups
                        if let Some(session_id) = Self::extract_session_id(&claude_json) {
                            msg_store.push_session_id(session_id);
                        }
                        
                        // Convert to normalized entries
                        for entry in processor.to_normalized_entries(&claude_json, &worktree_path) {
                            let patch_id = entry_index_provider.next();
                            let patch = ConversationPatch::add_normalized_entry(patch_id, entry);
                            msg_store.push_patch(patch);
                        }
                    }
                }
            }
        });
    }
}
```

### Benefits of Dual Processing
- **Debugging**: Raw logs preserve exact CLI behavior
- **UI Polish**: Normalized logs provide clean, structured display  
- **Agent Flexibility**: Each agent can have custom parsing logic
- **Backwards Compatibility**: System works even if normalization fails

---

## Innovation 5: AsyncGroupChild for Proper Process Management

**The Insight**: Standard tokio::process doesn't handle process trees correctly. Use command-group crate for proper lifecycle management.

### The Problem with Standard Process Management
```rust
// This DOESN'T work for complex CLI tools that spawn child processes
use tokio::process::Command;
let child = Command::new("claude")
    .spawn()?;
// When parent dies, child processes become zombies
```

### The Solution
```rust
// crates/executors/src/executors/claude.rs:36-71

use command_group::{AsyncCommandGroup, AsyncGroupChild};

impl StandardCodingAgentExecutor for ClaudeCode {
    async fn spawn(&self, current_dir: &PathBuf, prompt: &str) -> Result<AsyncGroupChild, ExecutorError> {
        let mut command = Command::new(shell_cmd);
        command
            .kill_on_drop(true)  // Critical: kills entire process tree
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .current_dir(current_dir);
        
        // This creates a process GROUP, not just a single process
        let mut child = command.group_spawn()?;
        
        // Feed prompt and close stdin so CLI knows input is complete
        if let Some(mut stdin) = child.inner().stdin.take() {
            stdin.write_all(combined_prompt.as_bytes()).await?;
            stdin.shutdown().await?;  // Critical: signals EOF to CLI
        }
        
        Ok(child)
    }
}
```

### Process Lifecycle Management
```rust
// crates/local-deployment/src/container.rs:58-100

impl LocalContainerService {
    // Store running processes for management
    child_store: Arc<RwLock<HashMap<Uuid, Arc<RwLock<AsyncGroupChild>>>>>,
    
    pub async fn stop_execution(&self, execution_process: &ExecutionProcess) -> Result<(), ContainerError> {
        if let Some(child_handle) = self.get_child_from_store(&execution_process.id).await {
            let mut child = child_handle.write().await;
            
            // This kills the ENTIRE process tree, not just the parent
            if let Err(e) = child.kill().await {
                tracing::error!("Failed to kill process {}: {}", execution_process.id, e);
                return Err(ContainerError::KillFailed(e));
            }
            
            // Wait for process to actually terminate
            let _ = child.wait().await;
        }
        
        // Clean up from tracking
        self.remove_child_from_store(&execution_process.id).await;
        Ok(())
    }
}
```

### Key Benefits
- **No Zombie Processes**: Entire process trees are cleaned up properly
- **Signal Propagation**: Signals reach all child processes
- **Resource Management**: Memory and file handles are freed correctly
- **Graceful Shutdown**: Processes can be stopped cleanly

---

## Implementation Guide: Adding a New AI Agent

Based on these innovations, here's the minimal pattern for adding new agents:

### Step 1: Implement the Core Trait
```rust
// crates/executors/src/executors/your_agent.rs

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
pub struct YourAgent {
    pub command: CommandBuilder,
    pub append_prompt: Option<String>,
}

#[async_trait]
impl StandardCodingAgentExecutor for YourAgent {
    async fn spawn(&self, current_dir: &PathBuf, prompt: &str) -> Result<AsyncGroupChild, ExecutorError> {
        // 1. Build CLI command
        let agent_command = self.command.build_initial();
        
        // 2. Use AsyncGroupChild for proper process management
        let mut command = Command::new("bash");
        command
            .kill_on_drop(true)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .current_dir(current_dir)
            .arg("-c")
            .arg(&agent_command);
            
        let mut child = command.group_spawn()?;
        
        // 3. Send prompt and close stdin
        if let Some(mut stdin) = child.inner().stdin.take() {
            stdin.write_all(prompt.as_bytes()).await?;
            stdin.shutdown().await?;
        }
        
        Ok(child)
    }
    
    async fn spawn_follow_up(&self, current_dir: &PathBuf, prompt: &str, session_id: &str) -> Result<AsyncGroupChild, ExecutorError> {
        // Implement follow-up logic using session_id
        // Or return FollowUpNotSupported if agent doesn't support sessions
        Err(ExecutorError::FollowUpNotSupported("YourAgent doesn't support follow-ups".to_string()))
    }
    
    fn normalize_logs(&self, msg_store: Arc<MsgStore>, worktree_path: &PathBuf) {
        let entry_index_counter = EntryIndexProvider::seeded_from_msg_store(&msg_store);
        
        // Always handle stderr
        normalize_stderr_logs(msg_store.clone(), entry_index_counter.clone());
        
        // Choose stdout processing strategy:
        
        // For plain text output:
        tokio::spawn(async move {
            let mut stdout = msg_store.stdout_chunked_stream();
            let mut processor = PlainTextLogProcessor::builder()
                .normalized_entry_producer(Box::new(|content| NormalizedEntry {
                    timestamp: None,
                    entry_type: NormalizedEntryType::AssistantMessage,
                    content,
                    metadata: None,
                }))
                .index_provider(entry_index_counter)
                .build();
                
            while let Some(Ok(chunk)) = stdout.next().await {
                for patch in processor.process(chunk) {
                    msg_store.push_patch(patch);
                }
            }
        });
        
        // For JSON output: implement custom processor similar to ClaudeLogProcessor
    }
}
```

### Step 2: Add to Agent Enum
```rust
// crates/executors/src/executors/mod.rs

#[enum_dispatch]
pub enum CodingAgent {
    ClaudeCode,
    Gemini,
    YourAgent,  // Add here
    // ...
}

// Add import
use crate::executors::your_agent::YourAgent;
```

### Step 3: Add Profile Configuration  
```rust
// crates/executors/src/profile.rs - in get_default_profiles()

profiles.insert("your-agent".to_string(), ProfileConfig {
    default: ProfileVariant {
        label: "Your Agent".to_string(),
        agent: CodingAgent::YourAgent(YourAgent {
            command: CommandBuilder::new("your-agent-cli"),
            append_prompt: None,
        }),
    },
    variants: HashMap::new(),
});
```

---

## Production Deployment Considerations

### Scalability Patterns
1. **Process Pool Management**: Pre-spawn agent processes for faster response times
2. **Resource Limits**: Implement cgroups or similar for CPU/memory limits
3. **Queue Management**: Add Redis-based task queuing for high concurrency

### Security Considerations
1. **Sandbox Enhancement**: Consider combining worktrees with containers for stronger isolation
2. **Input Validation**: Sanitize all prompts and agent outputs
3. **Resource Monitoring**: Track and limit resource usage per execution

### Reliability Patterns
1. **Health Checks**: Regular validation of agent availability and system health
2. **Circuit Breakers**: Prevent cascade failures when agents become unreliable
3. **State Persistence**: Critical execution state should survive system restarts

### Monitoring and Observability
1. **Structured Logging**: All components emit structured logs with correlation IDs
2. **Metrics Collection**: Track execution times, success rates, and resource usage
3. **Real-time Dashboards**: Monitor system health and agent performance

---

## Conclusion

These 5 innovations work together to create a robust, scalable system for managing multiple AI coding agents:

1. **Git Worktrees** provide lightweight, git-native isolation
2. **MsgStore Broadcast** enables real-time streaming with history replay
3. **Enum Dispatch** gives zero-cost polymorphism for agent extensibility  
4. **Dual Log Processing** preserves raw output while extracting semantic meaning
5. **AsyncGroupChild** ensures proper process lifecycle management

The key insight is that **isolation doesn't require containers** - git worktrees provide sufficient isolation for most use cases while being much more lightweight. Combined with proper process management and real-time streaming, this creates an elegant solution to the multi-agent coordination problem.

This architecture has been battle-tested with Claude Code, Gemini CLI, Cursor, and other agents, proving its flexibility and robustness for production use.