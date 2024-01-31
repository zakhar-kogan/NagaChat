const { z } = require('zod');
const path = require('path');
const fs = require('fs').promises;
const express = require('express');
const upload = require('./multer');
const { processImageUpload } = require('~/server/services/Files/process');
const { logger } = require('~/config');

const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  const metadata = req.body;
  // TODO: add file size/type validation

  const uuidSchema = z.string().uuid();

  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!metadata.file_id) {
      throw new Error('No file_id provided');
    }

    if (!metadata.width) {
      throw new Error('No width provided');
    }

    if (!metadata.height) {
      throw new Error('No height provided');
    }
    /* parse to validate api call */
    uuidSchema.parse(metadata.file_id);
    metadata.temp_file_id = metadata.file_id;
    metadata.file_id = req.file_id;

    await processImageUpload({ req, res, file, metadata });
  } catch (error) {
    logger.error('[/files/images] Error processing file:', error);
    try {
      const filepath = path.join(
        req.app.locals.paths.imageOutput,
        req.user.id,
        path.basename(file.filename),
      );
      await fs.unlink(filepath);
    } catch (error) {
      logger.error('[/files/images] Error deleting file:', error);
    }
    res.status(500).json({ message: 'Error processing file' });
  }

  // do this if strategy is not local
  // finally {
  //   try {
  //     // await fs.unlink(file.path);
  //   } catch (error) {
  //     logger.error('[/files/images] Error deleting file:', error);

  //   }
  // }
});

module.exports = router;
