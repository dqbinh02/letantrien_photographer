import { Heading, Text, Column } from "@once-ui-system/core";
import Link from "next/link";

export default function Home() {
  return (
    <Column maxWidth="l" gap="xl" paddingY="12" horizontal="center">
      <Column fillWidth horizontal="start" gap="l" maxWidth="s" paddingX="l">
        <Column fillWidth horizontal="start" gap="m">
          <Heading variant="display-strong-l">
            Lê Triển
          </Heading>
          <Text variant="heading-default-l" onBackground="neutral-weak">
            Photographer
          </Text>
        </Column>

        <div style={{ width: '100%', height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '1rem 0' }} />

        <Column fillWidth horizontal="start" gap="m">
          <Text variant="body-default-s" onBackground="neutral-medium" align="start" style={{ lineHeight: '2', fontWeight: '300', letterSpacing: '0.02em' }}>
            Mình là Triển, photographer tại TP.HCM, thích ánh sáng tự nhiên và những khoảnh khắc không sắp đặt. Mình theo đuổi nhiếp ảnh kể chuyện – nơi mỗi bức ảnh không chỉ là hình ảnh mà là cảm xúc và câu chuyện của chính khoảnh khắc đó.<br />
            Mình tin rằng sự chân thật tạo nên sức sống cho một bộ ảnh, và nhiệm vụ của mình là lặng lẽ quan sát, bắt lấy những phút giây đẹp nhất khi chúng tự nhiên diễn ra. Nếu bạn muốn những bức ảnh mang dấu ấn riêng, nhẹ nhàng nhưng sâu sắc, rất vui nếu chúng ta có thể cùng nhau tạo nên điều đó.
          </Text>
        </Column>

        <Column fillWidth horizontal="start" paddingTop="l">
          <Link href="/albums" style={{ 
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s ease',
            textDecoration: 'none'
          }}>
            <Text variant="body-default-m" onBackground="neutral-medium" style={{ fontWeight: '400' }}>
              Xem albums →
            </Text>
          </Link>
        </Column>
      </Column>
    </Column>
  );
}
