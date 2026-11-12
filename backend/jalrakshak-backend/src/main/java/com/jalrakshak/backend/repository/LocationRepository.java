package com.jalrakshak.backend.repository;

import com.jalrakshak.backend.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
}