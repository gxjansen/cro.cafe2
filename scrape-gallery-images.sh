#!/bin/bash

# Create directory for gallery images
mkdir -p public/images/event-galleries

echo "Downloading gallery images from CRO.CAFE events..."

# Marketing Insights Event Gallery
echo "Downloading Marketing Insights Event gallery images..."
wget -O public/images/event-galleries/mie-gallery-1.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf5f07712d4ddb6b1aeef_crocafenewsroom(1)-min.jpeg"
wget -O public/images/event-galleries/mie-gallery-2.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6215df48e2ddac2dcd9_82795553_2971761346222088_3148190678412951552_o.jpeg"
wget -O public/images/event-galleries/mie-gallery-3.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6215df48e5c43c2dcda_image_8068ebf7-9f77-40f1-9bda-81013f3f503620200207_193049.jpeg"
wget -O public/images/event-galleries/mie-gallery-4.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6215df48e73dfc2dce6_IMG_20200205_232109.jpeg"
wget -O public/images/event-galleries/mie-gallery-5.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6225df48ecf07c2dcee_20200205_123601.jpeg"

# Emerce Engage Gallery
echo "Downloading Emerce Engage gallery images..."
wget -O public/images/event-galleries/engage-gallery-1.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf7c080e3817bd709d164_49139544736_c58b22f1d3_o.jpeg"
wget -O public/images/event-galleries/engage-gallery-2.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf7c080e3811bd109d16c_guido_bart_engage19_2.jpeg"

# Digital Analytics Congress Gallery
echo "Downloading Digital Analytics Congress gallery images..."
wget -O public/images/event-galleries/dac-gallery-1.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf72f297acc88f5b9944a_dac19-1.jpeg"
wget -O public/images/event-galleries/dac-gallery-2.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf72f297accd4deb9944b_48870233037_a791193e14_k.jpeg"

# Virtual Champagne Breakfast Gallery
echo "Downloading Virtual Champagne Breakfast gallery images..."
wget -O public/images/event-galleries/champagne-gallery-1.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf6447fb24edab6463a17_maxresdefault.jpeg"

# Emerce Conversion Gallery
echo "Downloading Emerce Conversion gallery images..."
wget -O public/images/event-galleries/conversion-gallery-1.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a58d015c3f2_IMG-20190411-WA0007.jpeg"
wget -O public/images/event-galleries/conversion-gallery-2.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a02c715c3ff_20190411_115931.jpeg"
wget -O public/images/event-galleries/conversion-gallery-3.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a8ba215c3f5_20190411_120533.jpeg"
wget -O public/images/event-galleries/conversion-gallery-4.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a258815c3f4_20190411_181202.jpeg"
wget -O public/images/event-galleries/conversion-gallery-5.jpeg "https://cdn.prod.website-files.com/5be066740487be149c23be72/604bf84dd3fe2a7cb315c3f3_5cb0764dc08e6f5b27a4f041_46864155014_18a62762ea_o-p-2000.jpeg"

echo "Gallery image download complete!"
echo "Downloaded images to: public/images/event-galleries/"