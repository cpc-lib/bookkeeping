package com.bookkeep.service;

import com.bookkeep.common.BusinessException;
import com.bookkeep.common.ResultCode;
import com.bookkeep.config.MinioConfig;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * MinIO文件上传服务: 记账凭证图片
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private static final Set<String> ALLOWED_TYPES = new HashSet<>(
            Arrays.asList("image/jpeg", "image/png", "image/webp", "image/gif"));
    private static final List<String> ALLOWED_SUFFIX = Arrays.asList(".jpg", ".jpeg", ".png", ".webp", ".gif");

    private final MinioClient minioClient;
    private final MinioConfig minioConfig;

    /**
     * 上传凭证图片, 返回可直接访问的URL
     */
    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "文件不能为空");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException(ResultCode.FILE_TYPE_INVALID);
        }

        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String suffix = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && ALLOWED_SUFFIX.contains(original.substring(dot))) {
            suffix = original.substring(dot);
        }

        // 按月份目录归档: 2024-06/uuid.jpg
        String objectName = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"))
                + "/" + UUID.randomUUID().toString().replace("-", "") + suffix;

        try (InputStream in = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(minioConfig.getBucket())
                    .object(objectName)
                    .stream(in, file.getSize(), -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            log.error("凭证图片上传MinIO失败", e);
            throw new BusinessException(ResultCode.UPLOAD_FAILED);
        }

        String url = minioConfig.getEndpoint() + "/" + minioConfig.getBucket() + "/" + objectName;
        log.info("凭证图片上传成功: {}", url);
        return url;
    }
}
