# Thu hút khách nước ngoài cho Timond Lab — Design

Status: **draft, chưa được chủ site duyệt.** Mọi mục đánh dấu _(giả định)_ là quyết định của người soạn, cần chủ site xác nhận hoặc sửa.

## Intent

Timond Lab (studio mô hình thủ công + phần mềm, site `timondlab.com`) muốn khách nước ngoài tìm thấy, tin tưởng và liên hệ được. Hiện site là một trang link-in-bio, chuyển VI/EN bằng JavaScript, nên bản tiếng Anh không thể xếp hạng trên Google và khách quốc tế không có đường mua/đặt hàng.

## Goals

- Có bản tiếng Anh riêng, được Google index đúng (URL riêng + hreflang).
- Khách nước ngoài đi từ trang chủ → sản phẩm → yêu cầu làm theo đơn (commission) bằng email, không cần tài khoản VN (Zalo/Shopee).
- Nêu rõ giao hàng quốc tế: thời gian, phí, thuế.
- Dữ liệu có cấu trúc (Organization, Product) để hiện đúng trên Google.

## Non-goals

- Không làm giỏ hàng/thanh toán trên site (Stripe/Shopify Payments được cho là không dùng được ở VN; chưa xác minh).
- Không thêm ngôn ngữ thứ ba, không thêm CMS, không thêm backend form.
- Không thay đổi giao diện hiện tại của trang tiếng Việt.

## Anti-goals

- Bản tiếng Việt tại `/` bị đổi nội dung hay mất link cũ.
- Tự động chuyển hướng theo ngôn ngữ trình duyệt (Google khuyên không làm).
- Bịa giá, thời gian giao hàng, đánh giá khách hàng.

## Giả định (chủ site chưa trả lời)

1. _(giả định)_ Khách mục tiêu: người sưu tầm/chơi mô hình ở nước ngoài, muốn mua hàng có sẵn hoặc đặt làm theo đơn. Phần mềm là dịch vụ phụ, không có trang riêng.
2. _(giả định)_ Liên hệ qua email (và Instagram nếu có). Thanh toán xử lý ngoài site (chưa chọn kênh).
3. _(giả định)_ Thuế/hải quan do người mua chịu, nói rõ trên trang Shipping. DDP tốn kém hơn nên không mặc định.

## Approaches

- **A. URL riêng cho từng ngôn ngữ trong cùng project Astro (chọn).** `/` giữ tiếng Việt, `/en/` là tiếng Anh, dùng i18n routing của Astro, hreflang và sitemap theo ngôn ngữ. Đánh đổi: phải tách chuỗi văn bản ra khỏi markup (file `index.astro` 1537 dòng hiện chứa cả hai ngôn ngữ), nhưng đây là cách Google khuyến nghị và chi phí thấp nhất.
- **B. Giữ một trang, chỉ thêm meta tiếng Anh.** Rẻ nhất nhưng Google vẫn thấy một URL tiếng Việt; không giải quyết vấn đề gốc.
- **C. Tách site tiếng Anh riêng (subdomain/domain).** Linh hoạt nhưng nhân đôi bảo trì, chia đôi uy tín domain; quá nặng cho một studio một người.

## Quyết định thiết kế

- Cấu trúc URL: `/` (vi), `/en/` (en); `x-default` trỏ `/en/`. _(giả định)_
- Văn bản tách vào `src/i18n/content.ts`; chuyển ngôn ngữ là liên kết `<a>` sang URL tương ứng, không dùng `localStorage`.
- Bản `en` ẩn Zalo và Shopee, đặt Email lên đầu.
- Giá `null` ⇒ hiển thị "Price on request" và **không** phát `offers` trong JSON-LD.
- Thêm trang: chi tiết sản phẩm, `commission`, `shipping` (cả hai ngôn ngữ).

## Việc ngoài code (chủ site tự làm, không nằm trong plan)

Video turntable/quy trình cắt thành Shorts/TikTok/Reels có phụ đề tiếng Anh; mở Instagram; cân nhắc shop Etsy làm kênh thanh toán (xác minh trong Shop Manager); tham gia Reddit đúng luật (r/minipainting cấm quảng cáo commission); đăng ký Google Search Console và gửi sitemap.

## Thông tin cần chủ site cung cấp

Giá USD từng sản phẩm; thời gian làm; bảng thời gian/phí ship theo khu vực; chính sách thuế; tài khoản Instagram; thêm ảnh sản phẩm.

## Để người xây quyết định

Tên slug, bố cục trang commission/shipping, nội dung bản dịch tiếng Anh chi tiết (theo văn phong hiện có).
