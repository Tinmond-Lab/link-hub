import type { Locale } from "./locales";

export interface Product {
  slotId: string;
  slug: string | null;
  name: string;
  desc: string;
  img: string;
  priceUsd: number | null;
  leadTime: string | null;
}

export interface Social {
  key:
    | "youtube"
    | "tiktok"
    | "facebook"
    | "instagram"
    | "shopee"
    | "zalo"
    | "email";
  name: string;
  handle: string;
  href: string;
}

export interface Commission {
  title: string;
  intro: string;
  stepsTitle: string;
  steps: { title: string; text: string }[];
  includeTitle: string;
  include: string[];
  ctaLabel: string;
  mailSubject: string;
  mailIntro: string;
}

export interface Shipping {
  title: string;
  intro: string;
  regionCol: string;
  timeCol: string;
  costCol: string;
  regions: { name: string; days: string | null; cost: string }[];
  dutiesTitle: string;
  dutiesNotice: string;
  returnsTitle: string;
  returnsNotice: string;
}

export interface HeroCta {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

export interface Content {
  hero: { subtitle: string; ctas: HeroCta[] };
  commission: Commission;
  shipping: Shipping;
  meta: {
    title: string;
    description: string;
    ogLocale: string;
    ogAlternate: string;
  };
  ui: Record<string, string>;
  socials: Social[];
  products: Product[];
  journeySteps: string[];
  buildPublic: { slotId: string; label: string; img: string | null }[];
  services: {
    key: "code" | "cuboid" | "paintbrush" | "layers";
    label: string;
  }[];
  values: string[];
  faq: { q: string; a: string; link?: { path: string; label: string } }[];
}

/** Set to the studio's Instagram profile URL to show it on the English page. */
export const INSTAGRAM_URL: string | null = null;

const socials: Social[] = [
  {
    key: "youtube",
    name: "YouTube",
    handle: "@timondlab",
    href: "https://youtube.com/@timondlab",
  },
  {
    key: "tiktok",
    name: "TikTok",
    handle: "@timondlab",
    href: "https://tiktok.com/@timondlab",
  },
  {
    key: "facebook",
    name: "Facebook",
    handle: "@timondlab",
    href: "https://facebook.com/timondlab",
  },
  {
    key: "shopee",
    name: "Shopee",
    handle: "@timondlab",
    href: "https://shopee.vn/timondlab",
  },
  {
    key: "zalo",
    name: "Zalo",
    handle: "0856694766",
    href: "https://zalo.me/84856694766",
  },
  {
    key: "email",
    name: "Email",
    handle: "timondlab@gmail.com",
    href: "mailto:timondlab@gmail.com",
  },
];

const bySocialKey = (key: Social["key"]): Social =>
  socials.find((s) => s.key === key)!;

/** Vietnamese visitors keep every channel; English visitors get channels that work outside Vietnam, Email first. */
const socialsFor = (locale: Locale): Social[] =>
  locale === "vi"
    ? socials
    : [
        bySocialKey("email"),
        bySocialKey("youtube"),
        bySocialKey("tiktok"),
        bySocialKey("facebook"),
        ...(INSTAGRAM_URL
          ? [
              {
                key: "instagram" as const,
                name: "Instagram",
                handle: "@timondlab",
                href: INSTAGRAM_URL,
              },
            ]
          : []),
      ];

/**
 * Owner-editable facts per product slug. Set `priceUsd` (e.g. 120) and/or a
 * per-language `leadTime` (e.g. { vi: "3–4 tuần", en: "3–4 weeks" }) to show
 * them on the product page; `null` renders "Price on request" / "Quoted per order".
 */
export const productFacts: Record<
  string,
  { priceUsd: number | null; leadTime: Record<Locale, string> | null }
> = {
  "nghinh-phong-tower": { priceUsd: null, leadTime: null },
  "miniature-diorama": { priceUsd: null, leadTime: null },
  "resin-figure": { priceUsd: null, leadTime: null },
};

const productBase = [
  {
    slotId: "prod-thap",
    slug: "nghinh-phong-tower",
    name: "Tháp Nghinh Phong",
    img: "/products/prod-thap.webp",
  },
  {
    slotId: "prod-diorama",
    slug: "miniature-diorama",
    name: "Miniature Diorama",
    img: "/products/prod-diorama.webp",
  },
  {
    slotId: "prod-figure",
    slug: "resin-figure",
    name: "Resin Figure",
    img: "/products/prod-figure.webp",
  },
  {
    slotId: "prod-soon",
    slug: null,
    name: "Coming Soon",
    img: "/products/prod-soon.webp",
  },
];

const productDesc: Record<Locale, string[]> = {
  vi: [
    "Diorama kiến trúc chi tiết, tái hiện công trình biểu tượng Phú Yên.",
    "Bối cảnh thu nhỏ kể chuyện, kết hợp ánh sáng và chi tiết thủ công.",
    "Figure resin sơn tay, giới hạn số lượng theo từng đợt.",
    "Dự án tiếp theo đang được phát triển — theo dõi để cập nhật.",
  ],
  en: [
    "Detailed architectural diorama recreating a landmark Phú Yên tower.",
    "Storytelling miniature scenes with hand-detailing and lighting.",
    "Hand-painted resin figures, released in limited batches.",
    "Next project in development — stay tuned for updates.",
  ],
};

const products = (locale: Locale): Product[] =>
  productBase.map((p, i) => ({
    ...p,
    desc: productDesc[locale][i],
    priceUsd: p.slug ? productFacts[p.slug].priceUsd : null,
    leadTime: (p.slug && productFacts[p.slug].leadTime?.[locale]) || null,
  }));

const services: Content["services"] = [
  { key: "code", label: "" },
  { key: "cuboid", label: "" },
  { key: "paintbrush", label: "" },
  { key: "layers", label: "" },
];
const withLabels = (labels: string[]): Content["services"] =>
  services.map((s, i) => ({ ...s, label: labels[i] }));

const vi: Content = {
  hero: {
    subtitle: "Lập trình viên phần mềm • Họa sĩ tô mô hình",
    ctas: [
      { label: "Khám phá sản phẩm", href: "#products", variant: "primary" },
      { label: "Xem hành trình", href: "#journey", variant: "secondary" },
      { label: "Liên hệ", href: "#social", variant: "secondary" },
    ],
  },
  shipping: {
    title: "Vận chuyển & thuế",
    intro:
      "Timond Lab gửi hàng quốc tế cho một số sản phẩm và đơn custom. Phí và thời gian được báo theo từng đơn, tuỳ quốc gia nhận hàng.",
    regionCol: "Khu vực",
    timeCol: "Thời gian",
    costCol: "Phí vận chuyển",
    regions: [
      { name: "Bắc Mỹ", days: null, cost: "Báo theo từng đơn" },
      { name: "Châu Âu", days: null, cost: "Báo theo từng đơn" },
      {
        name: "Châu Á - Thái Bình Dương",
        days: null,
        cost: "Báo theo từng đơn",
      },
      { name: "Khu vực khác", days: null, cost: "Báo theo từng đơn" },
    ],
    dutiesTitle: "Thuế & hải quan",
    dutiesNotice:
      "Thuế nhập khẩu, VAT và phí hải quan do nước nhận hàng thu và chưa nằm trong giá sản phẩm. Người mua chịu các khoản này khi nhận hàng.",
    returnsTitle: "Hàng hư hỏng khi vận chuyển",
    returnsNotice:
      "Nếu tác phẩm đến nơi bị hư hỏng, hãy gửi email kèm ảnh để chúng tôi cùng xử lý. Việc đổi trả được thống nhất theo từng trường hợp.",
  },
  commission: {
    title: "Đặt làm theo yêu cầu",
    intro:
      "Hãy kể ý tưởng của bạn — một figure, một diorama, một khung cảnh — Timond Lab sẽ biến nó thành tác phẩm sơn tay và gửi đi khắp nơi.",
    stepsTitle: "Quy trình",
    steps: [
      {
        title: "Gửi ý tưởng",
        text: "Gửi hình tham khảo, kích thước mong muốn và thời hạn của bạn.",
      },
      {
        title: "Nhận báo giá",
        text: "Chúng tôi phản hồi giá, thời gian làm và phí vận chuyển đến nơi bạn ở.",
      },
      {
        title: "Duyệt bản 3D",
        text: "Với tác phẩm điêu khắc, bạn duyệt mô hình 3D trước khi bắt đầu in.",
      },
      { title: "In 3D & đổ resin", text: "Tác phẩm được in 3D và đổ resin." },
      {
        title: "Sơn tay",
        text: "Sơn thủ công, kèm ảnh tiến độ trong quá trình làm.",
      },
      {
        title: "Đóng gói & gửi",
        text: "Đóng gói cẩn thận và gửi kèm mã theo dõi.",
      },
    ],
    includeTitle: "Hãy gửi kèm",
    include: [
      "Hình hoặc đường dẫn tham khảo",
      "Kích thước / tỉ lệ mong muốn",
      "Ngân sách dự kiến",
      "Thời hạn (nếu có)",
      "Quốc gia nhận hàng",
    ],
    ctaLabel: "Gửi yêu cầu",
    mailSubject: "Yêu cầu đặt làm theo yêu cầu",
    mailIntro: "Chào Timond Lab, mình muốn đặt làm một sản phẩm. Thông tin:",
  },
  meta: {
    title: "Timond Lab · LinkHub",
    description:
      "Timond Lab — studio sáng tạo kết hợp phát triển phần mềm với nghệ thuật mô hình thủ công.",
    ogLocale: "vi_VN",
    ogAlternate: "en_US",
  },
  ui: {
    searchPlaceholder: "Tìm liên kết, sản phẩm...",
    langLabel: "EN",
    langAria: "Switch to English",
    themeAria: "Toggle theme",
    avatarAlt: "Timond Lab avatar",
    aboutEyebrow: "Về Timond Lab",
    aboutBody:
      "Timond Lab là studio sáng tạo kết hợp phát triển phần mềm với nghệ thuật mô hình thủ công — nơi công nghệ và thủ công gặp nhau để tạo ra những sản phẩm độc bản, cùng câu chuyện phía sau từng ý tưởng: từ concept, in 3D, đổ resin, sơn vẽ, đóng gói đến phát triển phần mềm.",
    socialTitle: "Kết nối với Timond Lab",
    noResults: "Không tìm thấy kết quả phù hợp.",
    productsTitle: "Bộ sưu tập nổi bật",
    viewDetails: "Xem chi tiết",
    journeyTitle: "Hành trình tạo tác phẩm",
    bipTitle: "Build in Public",
    bipSub: "Dự án mới nhất, hậu trường & hành trình học hỏi",
    servicesTitle: "Dịch vụ",
    valuesTitle: "Giá trị cốt lõi",
    faqTitle: "Câu hỏi thường gặp",
    closingTitle: "Sẵn sàng bắt đầu?",
    closingSub:
      "Liên hệ Timond Lab để đặt sản phẩm hoặc trao đổi ý tưởng của bạn.",
    closingCta: "Liên hệ",
    backToTop: "Back to top",
    backHome: "Timond Lab",
    priceLabel: "Giá",
    priceOnRequest: "Liên hệ để báo giá",
    leadTimeLabel: "Thời gian thực hiện",
    quotedPerOrder: "Báo theo từng đơn",
    productEnquire: "Hỏi về sản phẩm này",
    enquirySubject: "Hỏi về",
    shippingLink: "Vận chuyển & thuế nhập khẩu",
    commissionLink: "Đặt làm theo yêu cầu",
  },
  socials: socialsFor("vi"),
  products: products("vi"),
  journeySteps: [
    "Ý tưởng",
    "Dựng 3D",
    "In 3D",
    "Sơn vẽ",
    "Đóng gói",
    "Vận chuyển",
  ],
  buildPublic: [
    { slotId: "bip-0", label: "Video mới nhất", img: null },
    {
      slotId: "bip-1",
      label: "Dự án đang làm",
      img: "/build-in-public/bip-1.webp",
    },
    {
      slotId: "bip-2",
      label: "Hậu trường",
      img: "/build-in-public/bip-2.webp",
    },
  ],
  services: withLabels([
    "Phát triển phần mềm",
    "Mô hình theo yêu cầu",
    "Sơn figure",
    "Thiết kế diorama",
  ]),
  values: [
    "Chất lượng hàng đầu",
    "Thủ công tỉ mỉ",
    "Chú trọng chi tiết",
    "Học hỏi không ngừng",
    "Khách hàng là trọng tâm",
    "Sáng tạo",
  ],
  faq: [
    {
      q: "Bạn sử dụng chất liệu gì?",
      a: "Chủ yếu là nhựa resin cao cấp, nhựa in 3D và sơn chuyên dụng cho mô hình, được lựa chọn kỹ để đảm bảo độ bền và chi tiết.",
    },
    {
      q: "Sản phẩm được làm như thế nào?",
      a: "Mỗi sản phẩm trải qua quy trình: lên ý tưởng, dựng mô hình 3D, in 3D, đổ resin, sơn tay và đóng gói thủ công.",
    },
    {
      q: "Tôi có thể đặt làm theo yêu cầu không?",
      a: "Có. Timond Lab nhận thực hiện các dự án custom theo ý tưởng riêng của bạn, từ figure đến diorama.",
      link: { path: "/commission/", label: "Gửi yêu cầu đặt làm" },
    },
    {
      q: "Có giao hàng quốc tế không?",
      a: "Có, Timond Lab hỗ trợ giao hàng quốc tế cho một số sản phẩm và đơn custom.",
      link: { path: "/shipping/", label: "Xem vận chuyển & thuế" },
    },
  ],
};

const en: Content = {
  hero: {
    subtitle: "Handmade miniatures, dioramas & figure painting from Vietnam",
    ctas: [
      {
        label: "Request a custom piece",
        href: "/en/commission/",
        variant: "primary",
      },
      { label: "Explore Products", href: "#products", variant: "secondary" },
      { label: "Contact Me", href: "#social", variant: "secondary" },
    ],
  },
  shipping: {
    title: "Shipping & duties",
    intro:
      "Timond Lab ships internationally for select products and custom orders. Cost and delivery time are quoted per order, depending on your country.",
    regionCol: "Region",
    timeCol: "Delivery time",
    costCol: "Shipping cost",
    regions: [
      { name: "North America", days: null, cost: "Quoted per order" },
      { name: "Europe", days: null, cost: "Quoted per order" },
      { name: "Asia-Pacific", days: null, cost: "Quoted per order" },
      { name: "Rest of world", days: null, cost: "Quoted per order" },
    ],
    dutiesTitle: "Duties & taxes",
    dutiesNotice:
      "Import duties, VAT and customs fees are charged by your country and are not included in the product price. They are the buyer's responsibility and are collected on delivery.",
    returnsTitle: "Damaged in transit",
    returnsNotice:
      "If your piece arrives damaged, email us photos and we'll sort it out together. Return arrangements are agreed case by case.",
  },
  commission: {
    title: "Custom commissions",
    intro:
      "Tell us your idea — a figure, a diorama, a scene — and we'll turn it into a hand-painted piece, shipped worldwide.",
    stepsTitle: "How it works",
    steps: [
      {
        title: "Share your idea",
        text: "Send reference images, the size you have in mind and your deadline.",
      },
      {
        title: "Get a quote",
        text: "We reply with a price, a timeline and the shipping cost to your country.",
      },
      {
        title: "Approve the 3D design",
        text: "For sculpted pieces you approve the 3D model before anything is printed.",
      },
      {
        title: "Print & cast",
        text: "The piece is 3D-printed and cast in resin.",
      },
      {
        title: "Hand-paint",
        text: "Painted by hand, with progress photos along the way.",
      },
      {
        title: "Pack & ship",
        text: "Carefully packed and shipped with tracking.",
      },
    ],
    includeTitle: "Please include",
    include: [
      "Reference images or links",
      "Approximate size / scale",
      "Budget range",
      "Deadline (if any)",
      "Country to ship to",
    ],
    ctaLabel: "Request a commission",
    mailSubject: "Commission request",
    mailIntro: "Hi Timond Lab, I'd like to commission a piece. Details:",
  },
  meta: {
    title: "Timond Lab · Handmade miniatures & dioramas from Vietnam",
    description:
      "Handmade miniatures, dioramas and hand-painted resin figures from Vietnam. Custom commissions welcome, worldwide shipping available.",
    ogLocale: "en_US",
    ogAlternate: "vi_VN",
  },
  ui: {
    searchPlaceholder: "Search links, products...",
    langLabel: "VI",
    langAria: "Chuyển sang tiếng Việt",
    themeAria: "Toggle theme",
    avatarAlt: "Timond Lab avatar",
    aboutEyebrow: "About Timond Lab",
    aboutBody:
      "Timond Lab is a creative studio blending software development with handcrafted miniature art — where technology and craftsmanship meet to build unique products, sharing every step of the journey: concept, 3D printing, resin casting, painting, packaging and software development.",
    socialTitle: "Connect with Timond Lab",
    noResults: "No matching results.",
    productsTitle: "Featured Collections",
    viewDetails: "View Details",
    journeyTitle: "The Making Journey",
    bipTitle: "Build in Public",
    bipSub: "Latest projects, behind the scenes & the learning journey",
    servicesTitle: "Services",
    valuesTitle: "Values",
    faqTitle: "FAQ",
    closingTitle: "Ready to start?",
    closingSub:
      "Reach out to Timond Lab to order a piece or talk through your idea.",
    closingCta: "Contact Me",
    backToTop: "Back to top",
    backHome: "Timond Lab",
    priceLabel: "Price",
    priceOnRequest: "Price on request",
    leadTimeLabel: "Lead time",
    quotedPerOrder: "Quoted per order",
    productEnquire: "Ask about this piece",
    enquirySubject: "Enquiry",
    shippingLink: "Shipping & import duties",
    commissionLink: "Request a custom piece",
  },
  socials: socialsFor("en"),
  products: products("en"),
  journeySteps: [
    "Idea",
    "3D Modeling",
    "Printing",
    "Painting",
    "Packaging",
    "Shipping",
  ],
  buildPublic: [
    { slotId: "bip-0", label: "Latest Video", img: null },
    {
      slotId: "bip-1",
      label: "Current Build",
      img: "/build-in-public/bip-1.webp",
    },
    {
      slotId: "bip-2",
      label: "Behind the Scenes",
      img: "/build-in-public/bip-2.webp",
    },
  ],
  services: withLabels([
    "Software Development",
    "Custom Miniatures",
    "Figure Painting",
    "Diorama Design",
  ]),
  values: [
    "Quality First",
    "Handcrafted",
    "Attention to Detail",
    "Continuous Learning",
    "Customer First",
    "Creativity",
  ],
  faq: [
    {
      q: "What materials do you use?",
      a: "Mainly premium resin, 3D-printed filament/resin, and dedicated miniature paints, chosen for durability and fine detail.",
    },
    {
      q: "How are products made?",
      a: "Each piece goes through: idea, 3D modeling, 3D printing, resin casting, hand painting and packaging.",
    },
    {
      q: "Can I order custom work?",
      a: "Yes — Timond Lab takes on custom projects, from figures to full dioramas, built around your idea.",
      link: { path: "/commission/", label: "Request a commission" },
    },
    {
      q: "Do you ship internationally?",
      a: "Yes, international shipping is available for select products and custom orders.",
      link: { path: "/shipping/", label: "See shipping & duties" },
    },
  ],
};

const content: Record<Locale, Content> = { vi, en };

export function getContent(locale: Locale): Content {
  return content[locale];
}

/** mailto: link that opens a pre-filled commission request. */
export function commissionMailto(locale: Locale): string {
  const { include, mailSubject, mailIntro } = getContent(locale).commission;
  const body = [mailIntro, ...include.map((item) => `- ${item}:`)].join("\n");
  return `mailto:timondlab@gmail.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;
}
