export type ShowcaseStatus = 'idle' | 'running' | 'paused' | 'completed';

/**
 * Stable id of the "split the length of a sum" misconception option
 * (|BC + DD'| = |BC| + |DD'| = 2) in the vector checkpoint. Matching by label
 * text is unsafe because the correct option also contains capital letters
 * such as "BC".
 */
export const SPLIT_LENGTH_TRAP_OPTION_ID = 'opt_b';

export interface ShowcaseStationConfig {
  id: number;
  title: string;
  shortTitle: string;
  durationMs: number;
  description: string;
}

export const SHOWCASE_STATIONS: ShowcaseStationConfig[] = [
  {
    id: 1,
    title: 'Trạm 1: Lớp học tương tác & Phản biện bẫy nhận thức',
    shortTitle: 'Trạm 1 · Lớp học',
    durationMs: 7000,
    description: 'Dừng video tại 37:13, học sinh chọn bẫy |a+b|=2 và Bo phản biện',
  },
  {
    id: 2,
    title: 'Trạm 2: Multi-Agent War Room suy luận thời gian thực',
    shortTitle: 'Trạm 2 · War Room',
    durationMs: 6000,
    description: 'Phát lại fixture bàn tròn suy luận đa tác tử và các lượt gọi công cụ',
  },
  {
    id: 3,
    title: 'Trạm 3: Multi-Track Timeline biên tập kịch bản bài học',
    shortTitle: 'Trạm 3 · Timeline',
    durationMs: 5000,
    description: 'Dòng thời gian đa luồng, thước đo nhịp sư phạm và xem trước bảng đen',
  },
  {
    id: 4,
    title: 'Trạm 4: Đánh giá nhận thức Tháp Bloom & Soi não tác nhân',
    shortTitle: 'Trạm 4 · Tháp Bloom',
    durationMs: 5000,
    description: 'Thanh tra 4 khối nhận thức: Điều phối, Ngữ cảnh cách ly và Chấm ngầm',
  },
];
