package com.jalrakshak.backend.repository;

import com.jalrakshak.backend.model.Response;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResponseRepository extends JpaRepository<Response, Long> {

    List<Response> findByAlertId(Long alertId);

    List<Response> findByUserId(Long userId);

    List<Response> findByResponseStatus(String responseStatus);
}