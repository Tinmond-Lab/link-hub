import type { Locale } from "./locales";

export interface Product {
  slotId: string;
  slug: string | null;
  name: string;
  desc: string;
  img: string;
  imgWidth: number;
  imgHeight: number;
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

export interface Service {
  key: "design3d" | "print3d" | "software";
  name: string;
  desc: string;
  /** Price in VND. `max` is null for "from <min>" pricing. */
  minVnd: number;
  maxVnd: number | null;
}

export interface HeroCta {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "quiet";
  /** Open in a new tab (chat apps and other sites). */
  external?: boolean;
}

export interface Content {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    imageAlt: string;
    ctas: HeroCta[];
  };
  about: {
    eyebrow: string;
    title: string;
    body: string;
    makes: string[];
    software: string;
    values: string;
  };
  commission: Commission;
  services: Service[];
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
  faq: { q: string; a: string; link?: { path: string; label: string } }[];
}

/** Link to the newest video. Paste a new YouTube link here (Shorts, watch or youtu.be) to update the home page card. */
export const LATEST_VIDEO_URL = "https://www.youtube.com/shorts/XvO6u8sVaPc";

/** Extracts the 11-character video id from a YouTube Shorts, watch or youtu.be link. */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:shorts\/|watch\?(?:[^#]*&)?v=)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

const latestVideoId = youtubeId(LATEST_VIDEO_URL);
export const latestVideo: { href: string; img: string | null } = {
  img: latestVideoId
    ? `https://i.ytimg.com/vi/${latestVideoId}/maxresdefault.jpg`
    : null,
  href: LATEST_VIDEO_URL,
};

/** Maker portrait path; stays null until a verified photo is supplied. */
export const MAKER_PHOTO: string | null = null;

/**
 * Where visitors start a chat. Messenger opens the Facebook page's inbox (the page must allow
 * messages); Zalo opens the studio's number. Used by the hero, the commission band and the
 * commission and product pages.
 */
export const MESSENGER_URL = "https://m.me/timondlab";
export const ZALO_URL = "https://zalo.me/84856694766";

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
    href: ZALO_URL,
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
    imgWidth: 1000,
    imgHeight: 1000,
  },
  {
    slotId: "prod-diorama",
    slug: "miniature-diorama",
    name: "Miniature Diorama",
    img: "/products/prod-diorama.webp",
    imgWidth: 1000,
    imgHeight: 750,
  },
  {
    slotId: "prod-figure",
    slug: "resin-figure",
    name: "Resin Figure",
    img: "/products/prod-figure.webp",
    imgWidth: 1000,
    imgHeight: 800,
  },
  {
    slotId: "prod-soon",
    slug: null,
    name: "Coming Soon",
    img: "/products/prod-soon.webp",
    imgWidth: 1000,
    imgHeight: 750,
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

const vi: Content = {
  hero: {
    eyebrow: "Mô hình thủ công",
    title: "In 3D, đổ resin và sơn tay tại Việt Nam.",
    subtitle:
      "Diorama, mô hình kiến trúc và figure resin sơn tay. Nhận đặt làm theo yêu cầu, giao hàng quốc tế.",
    imageAlt: "Mô hình kiến trúc Tháp Nghinh Phong trên nền tối",
    ctas: [
      {
        label: "Nhắn tin Facebook",
        href: MESSENGER_URL,
        variant: "primary",
        external: true,
      },
      {
        label: "Nhắn tin Zalo",
        href: ZALO_URL,
        variant: "secondary",
        external: true,
      },
      { label: "Xem tác phẩm", href: "#works", variant: "quiet" },
    ],
  },
  about: {
    eyebrow: "Giới thiệu",
    title: "Studio nhỏ cho nghệ thuật mô hình",
    body: "Timond Lab kết hợp công nghệ và thủ công: mỗi tác phẩm đi từ ý tưởng đến mô hình 3D, in, đổ resin, sơn tay và đóng gói cẩn thận.",
    makes: ["Mô hình theo yêu cầu", "Sơn figure", "Thiết kế diorama"],
    software: "Studio cũng phát triển phần mềm.",
    values:
      "Chất lượng hàng đầu · Thủ công tỉ mỉ · Chú trọng chi tiết · Học hỏi không ngừng",
  },
  services: [
    {
      key: "design3d",
      name: "Thiết kế file in 3D",
      desc: "Dựng mô hình 3D từ ý tưởng hoặc hình tham khảo của bạn, xuất file sẵn sàng để in.",
      minVnd: 100000,
      maxVnd: 500000,
    },
    {
      key: "print3d",
      name: "In 3D",
      desc: "In 3D mô hình theo file của bạn.",
      minVnd: 50000,
      maxVnd: 300000,
    },
    {
      key: "software",
      name: "Thiết kế phần mềm",
      desc: "Phát triển phần mềm theo yêu cầu, tính giá theo từng chức năng.",
      minVnd: 500000,
      maxVnd: null,
    },
  ],
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
        text: "Bạn duyệt mô hình 3D trước khi bắt đầu in.",
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
  },
  meta: {
    title: "Timond Lab · Mô hình thủ công & diorama từ Việt Nam",
    description:
      "Mô hình thu nhỏ, diorama và figure resin sơn tay, làm thủ công tại Việt Nam. Nhận đặt làm theo yêu cầu, giao hàng quốc tế.",
    ogLocale: "vi_VN",
    ogAlternate: "en_US",
  },
  ui: {
    linksTitle: "Timond Lab · Liên kết",
    linksLead: "Mô hình thủ công từ Việt Nam",
    visitStudio: "Ghé thăm studio",
    langLabel: "EN",
    langAria: "EN – English",
    viewDetails: "Xem chi tiết",
    worksEyebrow: "Bộ sưu tập",
    worksTitle: "Tác phẩm chọn lọc",
    workPhotoAlt: "Ảnh tác phẩm {name}",
    comingSoonAlt: "Một figure phủ dưới lớp vải mỏng, tác phẩm tiếp theo",
    processEyebrow: "Quy trình",
    processTitle: "Từ ý tưởng đến tay bạn",
    videoEyebrow: "Build in Public",
    videoTitle: "Video mới nhất",
    videoWatch: "Xem trên YouTube",
    videoAlt: "Ảnh bìa video mới nhất của Timond Lab",
    commissionEyebrow: "Đặt làm",
    shipsWorldwide: "Giao hàng quốc tế",
    seeShipping: "Xem vận chuyển & thuế",
    faqEyebrow: "Hỏi đáp",
    makerPhotoAlt: "Chân dung người làm ra các tác phẩm Timond Lab",
    faqTitle: "Câu hỏi thường gặp",
    servicesTitle: "Dịch vụ & bảng giá",
    servicesLead:
      "Giá tham khảo bằng VND. Giá cuối cùng phụ thuộc kích thước và độ phức tạp, sẽ được báo trước khi bắt đầu.",
    priceFrom: "Từ",
    perFeature: "mỗi chức năng",
    priceLabel: "Giá",
    priceOnRequest: "Liên hệ để báo giá",
    leadTimeLabel: "Thời gian thực hiện",
    quotedPerOrder: "Báo theo từng đơn",
    contactFacebook: "Nhắn tin Facebook",
    contactZalo: "Nhắn tin Zalo",
    contactProductHint: "Nhắn tên tác phẩm bạn quan tâm và nước nhận hàng.",
    shippingLink: "Vận chuyển & thuế nhập khẩu",
    commissionLink: "Đặt làm theo yêu cầu",
    navWorks: "Tác phẩm",
    navProcess: "Quy trình",
    navCommission: "Liên hệ",
    navAbout: "Giới thiệu",
    menu: "Menu",
    navMain: "Điều hướng chính",
    skipToContent: "Bỏ qua đến nội dung",
    footerTagline: "Build Ideas Into Reality",
    linksPage: "Tất cả liên kết",
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
    eyebrow: "Handmade miniatures",
    title: "3D-printed, resin-cast and hand-painted in Vietnam.",
    subtitle:
      "Dioramas, architectural miniatures and hand-painted resin figures. Custom commissions welcome, shipped worldwide.",
    imageAlt: "Tháp Nghinh Phong architectural miniature on a dark background",
    ctas: [
      {
        label: "Message on Facebook",
        href: MESSENGER_URL,
        variant: "primary",
        external: true,
      },
      {
        label: "Message on Zalo",
        href: ZALO_URL,
        variant: "secondary",
        external: true,
      },
      { label: "View works", href: "#works", variant: "quiet" },
    ],
  },
  about: {
    eyebrow: "About",
    title: "A small studio for miniature art",
    body: "Timond Lab blends technology and craftsmanship: every piece goes from idea to 3D model, print, resin, hand painting and careful packaging.",
    makes: ["Custom miniatures", "Figure painting", "Diorama design"],
    software: "The studio also builds software.",
    values:
      "Quality first · Handcrafted · Attention to detail · Always learning",
  },
  services: [
    {
      key: "design3d",
      name: "3D print file design",
      desc: "We model your idea or reference images in 3D and export a file that is ready to print.",
      minVnd: 100000,
      maxVnd: 500000,
    },
    {
      key: "print3d",
      name: "3D printing",
      desc: "3D printing from your file.",
      minVnd: 50000,
      maxVnd: 300000,
    },
    {
      key: "software",
      name: "Software development",
      desc: "Custom software, priced by feature.",
      minVnd: 500000,
      maxVnd: null,
    },
  ],
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
        text: "You approve the 3D model before anything is printed.",
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
  },
  meta: {
    title: "Timond Lab · Handmade miniatures & dioramas from Vietnam",
    description:
      "Handmade miniatures, dioramas and hand-painted resin figures from Vietnam. Custom commissions welcome, worldwide shipping available.",
    ogLocale: "en_US",
    ogAlternate: "vi_VN",
  },
  ui: {
    linksTitle: "Timond Lab · Links",
    linksLead: "Handmade miniatures from Vietnam",
    visitStudio: "Visit the studio",
    langLabel: "VI",
    langAria: "VI – Tiếng Việt",
    viewDetails: "View details",
    worksEyebrow: "Collection",
    worksTitle: "Selected works",
    workPhotoAlt: "Photo of {name}",
    comingSoonAlt: "A figure veiled under a thin cloth, the next piece",
    processEyebrow: "Process",
    processTitle: "From idea to your door",
    videoEyebrow: "Build in public",
    videoTitle: "Latest video",
    videoWatch: "Watch on YouTube",
    videoAlt: "Thumbnail of the latest Timond Lab video",
    commissionEyebrow: "Commissions",
    shipsWorldwide: "Worldwide shipping",
    seeShipping: "See shipping & duties",
    faqEyebrow: "Questions",
    makerPhotoAlt: "Portrait of the maker behind Timond Lab",
    faqTitle: "Frequently asked questions",
    servicesTitle: "Services & pricing",
    servicesLead:
      "Indicative prices in VND. The final price depends on size and complexity and is quoted before work starts.",
    priceFrom: "From",
    perFeature: "per feature",
    priceLabel: "Price",
    priceOnRequest: "Price on request",
    leadTimeLabel: "Lead time",
    quotedPerOrder: "Quoted per order",
    contactFacebook: "Message on Facebook",
    contactZalo: "Message on Zalo",
    contactProductHint: "Tell us which piece you like and where to ship it.",
    shippingLink: "Shipping & import duties",
    commissionLink: "Request a commission",
    navWorks: "Works",
    navProcess: "Process",
    navCommission: "Contact",
    navAbout: "About",
    menu: "Menu",
    navMain: "Main navigation",
    skipToContent: "Skip to content",
    footerTagline: "Build Ideas Into Reality",
    linksPage: "All links",
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

export function processChapters(
  locale: Locale,
): { title: string; text: string }[] {
  const c = content[locale];
  const st = c.commission.steps;
  const texts = [
    st[0].text,
    st[2].text,
    st[3].text,
    st[4].text,
    st[5].text,
    c.shipping.intro,
  ];
  return c.journeySteps.map((title, i) => ({ title, text: texts[i] }));
}

/** "100,000–500,000 VND" or "From 500,000 VND per feature", built from the numbers so HTML, markdown and JSON-LD agree. */
export function servicePrice(locale: Locale, s: Service): string {
  const n = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US");
  const ui = content[locale].ui;
  if (s.maxVnd === null) {
    return `${ui.priceFrom} ${n.format(s.minVnd)} VND ${ui.perFeature}`;
  }
  return `${n.format(s.minVnd)}–${n.format(s.maxVnd)} VND`;
}

export function getContent(locale: Locale): Content {
  return content[locale];
}
