### **Tài liệu: Ý tưởng Dự án \- BMAD 2.0: The MCP-Powered Hub**

**1\. Tuyên bố Tầm nhìn (Vision Statement)**

**Tái định nghĩa BMAD từ một phương pháp dựa trên tệp tin thành một hệ sinh thái phát triển AI động, cộng tác và tập trung, được vận hành bởi một "trung tâm dự án" (Project Hub) duy nhất hoạt động như một MCP Server. Trao quyền cho các agent AI với khả năng truy cập dữ liệu thời gian thực, có cấu trúc và an toàn, mở đường cho việc tự động hóa các dự án phức tạp và làm việc nhóm hiệu quả.**

**2\. Tuyên bố Vấn đề (Problem Statement)**

Phiên bản hiện tại của BMAD, mặc dù đột phá về mặt khái niệm, nhưng lại bị giới hạn bởi kiến trúc dựa trên hệ thống tệp cục bộ. Điều này dẫn đến các vấn đề nghiêm trọng khi mở rộng quy mô và ứng dụng trong môi trường làm việc nhóm:

* **Thiếu nguồn chân lý duy nhất (Single Source of Truth):** Dữ liệu dự án (PRD, tasks, trạng thái) bị phân mảnh trên nhiều tệp .md, dẫn đến sự không nhất quán và khó khăn trong việc đồng bộ.  
* **Không thể cộng tác thời gian thực:** Các thành viên trong nhóm (hoặc các agent chạy song song) không thể làm việc trên cùng một bộ dữ liệu một cách an toàn, nguy cơ xung đột và ghi đè dữ liệu là rất cao.  
* **Khả năng truy vấn yếu kém:** Không có cách nào để thực hiện các truy vấn dữ liệu phức tạp, ví dụ: "Hiển thị tất cả các nhiệm vụ trong Sprint 2 thuộc Epic 'Thanh toán' đang được gán cho Dev Agent A".  
* **Rủi ro bảo mật và toàn vẹn dữ liệu:** Bất kỳ agent nào có quyền truy cập hệ thống tệp đều có thể sửa đổi bất kỳ tệp nào, không có cơ chế phân quyền rõ ràng.

**3\. Giải pháp Đề xuất (Proposed Solution)**

Chúng tôi đề xuất xây dựng **"MCP Project Hub"** \- một ứng dụng máy chủ (server) độc lập, đóng vai trò là lõi trung tâm và là nguồn chân lý duy nhất cho tất cả các dự án được quản lý bằng BMAD.

Đồng thời, chúng tôi sẽ nâng cấp **BMAD Method** để các agent của nó hoạt động như những **MCP Client**, tương tác với Hub thông qua một bộ API được tiêu chuẩn hóa thay vì truy cập hệ thống tệp.

**4\. Kiến trúc Tổng thể của Giải pháp**

Hệ thống mới sẽ bao gồm các thành phần sau:

* **MCP Project Hub (Server):**  
  * **Giao diện Web (Web UI):** Cung cấp giao diện cho người dùng (con người) để quản lý dự án, xem báo cáo, và phê duyệt.  
  * **Lớp API (MCP Functions):** Cung cấp các endpoints theo chuẩn MCP để các agent AI có thể đọc/ghi dữ liệu.  
  * **Cơ sở dữ liệu (Database):** Lưu trữ toàn bộ dữ liệu dự án (tài liệu, epics, sprints, tasks) một cách có cấu trúc.  
* **BMAD 2.0 Agents (Clients):**  
  * Mỗi agent sẽ được tích hợp một thư viện **MCP Client**.  
  * Logic cốt lõi của agent sẽ được sửa đổi để gọi các hàm từ MCP Client thay vì các lệnh hệ thống tệp.

**Sơ đồ kiến trúc cấp cao:**

graph TD  
    subgraph User Space  
        A\[Người dùng\]  
    end

    subgraph Agent Space  
        B\[PM Agent\]  
        C\[SM Agent\]  
        D\[Dev Agent\]  
    end

    subgraph Server Space  
        E\[Web UI\]  
        F\[MCP API Layer\]  
        G\[Database\]  
    end

    A \--- E  
    B \-- MCP Call \--\> F  
    C \-- MCP Call \--\> F  
    D \-- MCP Call \--\> F  
    E \<--\> F  
    F \<--\> G

    style F fill:\#bbf,stroke:\#333,stroke-width:2px

**5\. Lợi ích Chính**

* **Cộng tác:** Cho phép nhiều người dùng và nhiều agent cùng làm việc trên một dự án.  
* **Nhất quán:** Đảm bảo mọi người đều truy cập vào phiên bản dữ liệu mới nhất.  
* **Minh bạch:** Cung cấp cái nhìn tổng quan, thời gian thực về tiến độ dự án.  
* **Mạnh mẽ:** Thay thế các thao tác trên tệp dễ lỗi bằng các lệnh gọi API có cấu trúc và đáng tin cậy.  
* **Bảo mật:** Cho phép kiểm soát truy cập chi tiết đến từng tài nguyên.