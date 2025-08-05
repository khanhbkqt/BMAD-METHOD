### **Tài liệu Yêu cầu Sản phẩm (PRD): MCP Project Hub (Kiến trúc Local CLI)**

Phiên bản: 2.0

Ngày: 03-08-2025

**1\. Giới thiệu**

Tài liệu này mô tả các yêu cầu cho sản phẩm **"MCP Project Hub"** (sau đây gọi là "Hub"). Hub là một công cụ dòng lệnh (CLI tool) được thiết kế để hoạt động như một "máy chủ" MCP cục bộ, cung cấp một nguồn chân lý duy nhất và bền bỉ (persistent) cho các agent của BMAD Method. Nó sẽ được thực thi thông qua npx và giao tiếp với các agent qua stdio.

**2\. Vấn đề và Giải pháp**

* **Vấn đề:** Các quy trình làm việc của BMAD hiện tại dựa trên các tệp tin cục bộ, gây khó khăn cho việc cộng tác, theo dõi, và truy vấn dữ liệu phức tạp. Việc triển khai một web server và cơ sở dữ liệu đầy đủ lại quá phức tạp cho môi trường phát triển cá nhân.  
* **Giải pháp:** Hub sẽ cung cấp một cơ sở dữ liệu cục bộ, nhẹ (ví dụ: SQLite) và một giao diện giao tiếp có cấu trúc dựa trên JSON-RPC qua stdio. Điều này cho phép các agent tương tác với dữ liệu dự án một cách nhất quán và đáng tin cậy mà không cần cài đặt phức tạp.

**3\. Đối tượng Người dùng (User Personas)**

* **Agent AI (Programmatic User \- Đối tượng chính):** Cần một giao diện ổn định, nhanh chóng để tự động hóa các quy trình: tạo tài liệu (PM Agent), phân rã công việc (SM Agent), thực thi nhiệm vụ (Dev Agent), và kiểm thử (QA Agent).  
* **Lập trình viên (Human User \- Qua CLI):** Cần các lệnh đơn giản để khởi tạo dự án, truy vấn trạng thái, hoặc thực hiện các tác vụ quản trị cơ bản trực tiếp từ terminal.

**4\. Tính năng Chi tiết (Features)**

**4.1. Quản lý Dự án (CLI)**

* **F1.1:** Cung cấp lệnh bmad-mcp-hub init \--name "My Project" để tạo một dự án mới. Hệ thống sẽ tạo một tệp cơ sở dữ liệu cục bộ (ví dụ: .bmad/project.db) và trả về projectId.  
* **F1.2:** Cung cấp lệnh bmad-mcp-hub status để hiển thị tóm tắt nhanh về trạng thái của sprint đang hoạt động (tên, mục tiêu, % hoàn thành).

**4.2. Quản lý Tài liệu**

* **F2.1:** Agent có thể tạo tài liệu (PRD, ARCHITECTURE, v.v.) thông qua giao tiếp stdio.  
* **F2.2:** Mỗi tài liệu có các thuộc tính: id, type, title, content (Markdown), status, version.  
* **F2.3 (Workflow Phê duyệt):**  
  * Trạng thái tài liệu: DRAFT, IN\_REVIEW, APPROVED, REJECTED.  
  * Agent có thể thay đổi trạng thái của tài liệu.  
* **F2.4:** Cung cấp các hàm getDocument(id) và listDocuments(projectId) cho các agent.

**4.3. Quản lý Công việc Agile**

* **F3.1 (Epics):**  
  * Agent có thể tạo, xem, sửa, xóa các Epic.  
  * Mỗi Epic là một nhóm chứa các Task liên quan.  
* **F3.2 (Sprints):**  
  * Agent có thể tạo các Sprint với name, goal, startDate, endDate.  
  * Một dự án chỉ có thể có một Sprint ACTIVE tại một thời điểm.  
  * Agent có thể di chuyển các Task từ backlog vào một Sprint.  
* **F3.3 (Tasks/Stories):**  
  * Agent có thể tạo Task, liên kết nó với một Epic.  
  * Mỗi Task có các thuộc tính: title, description, status, assignee.  
  * Trạng thái Task: TODO, IN\_PROGRESS, IN\_REVIEW, DONE, BLOCKED.

**4.4. Lớp Giao tiếp MCP (Giao thức Stdio)**

* **F4.1:** Hub phải chấp nhận các yêu cầu JSON-RPC từ stdin và trả về các phản hồi JSON-RPC qua stdout.  
* **F4.2:** Giao thức phải hỗ trợ tất cả các hàm đã được định nghĩa trong tài liệu thiết kế kỹ thuật (TechDesign), bao gồm quản lý Document, Epic, Sprint, và Task.  
* **F4.3 (Không cần xác thực):** Vì là một công cụ cục bộ, không yêu cầu xác thực qua API Key.

**5\. Yêu cầu Phi chức năng (Non-Functional Requirements)**

* **NFR1 (Hiệu năng):** Thời gian khởi động của tiến trình bmad-mcp-hub phải dưới 500ms. Thời gian xử lý cho mỗi yêu cầu qua stdio phải dưới 50ms.  
* **NFR2 (Tài nguyên):** Mức sử dụng bộ nhớ (RAM) của tiến trình Hub không được vượt quá 100MB trong điều kiện hoạt động bình thường.  
* **NFR3 (Tính bền bỉ):** Tất cả dữ liệu phải được lưu trữ an toàn trong một tệp cơ sở dữ liệu cục bộ để đảm bảo không bị mất giữa các lần chạy.  
* **NFR4 (Tính di động):** Công cụ phải hoạt động nhất quán trên các hệ điều hành phổ biến (Windows, macOS, Linux).

**6\. Tiêu chí Thành công (Success Metrics)**

* **Adoption:** 100% các quy trình của BMAD Method được chuyển đổi thành công sang sử dụng bmad-mcp-hub trong vòng 1 tháng sau khi triển khai.  
* **Efficiency:** Giảm 50% thời gian cần thiết cho SM Agent để tạo và quản lý các story so với quy trình dựa trên tệp, nhờ vào việc truy vấn có cấu trúc.  
* **Reliability:** Giảm 95% các lỗi liên quan đến xung đột tệp và trạng thái không nhất quán.  
* **Simplicity:** Người dùng có thể thiết lập và chạy một dự án mới với tối đa 2 lệnh CLI.  