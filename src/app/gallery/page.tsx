import { Flex, Meta } from "@once-ui-system/core";
import GalleryView from "@/components/gallery/GalleryView";
import { baseURL, gallery, person } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: gallery.title,
    description: gallery.description,
    baseURL: baseURL,
    path: gallery.path,
  });
}

export default function Gallery() {
  return (
    <Flex maxWidth="l">
      <GalleryView images={gallery.images} />
    </Flex>
  );
}
