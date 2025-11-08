import { Heading, Text, Column } from "@once-ui-system/core";

export default function Home() {
  return (
    <Column maxWidth="m" gap="xl" paddingY="12" horizontal="center">
      <Column fillWidth horizontal="center" gap="m">
        <Heading variant="display-strong-l">
          Welcome to Photographer
        </Heading>
        <Text variant="heading-default-xl" onBackground="neutral-weak">
          Explore my photo albums and gallery
        </Text>
      </Column>
    </Column>
  );
}
