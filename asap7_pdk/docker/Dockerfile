# ngspice-46 + OSDI + BSIM-CMG for ASAP7 simulation
#
# ngspice supports the FinFET model BSIM-CMG (HSPICE level=72) only through
# its OSDI interface, i.e. the Verilog-A model must first be compiled with
# OpenVAF. This image packages:
#   - ngspice-46 built from source with --enable-osdi
#   - OpenVAF 23.5.0 (linux amd64, prebuilt)
#   - bsimcmg_va.osdi compiled from the BSIM-CMG 111 Verilog-A sources
#     (in ./bsimcmg_va, taken from the OpenVAF integration tests)
#   - the ASAP7 OSDI model cards (../models/ngspice/7nm_TT_osdi.pm)
#   - a smoke test that runs during the build
#
# Build:  docker build -t ngspice-osdi .
# Use:    ../bin/ngspice -b <netlist>     (wrapper, see asap7_pdk/README.md)

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates bison flex \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

# ngspice-46 with OSDI support
RUN curl -sL -o ngspice-46.tar.gz \
      "https://downloads.sourceforge.net/project/ngspice/ng-spice-rework/46/ngspice-46.tar.gz" \
    && tar xzf ngspice-46.tar.gz && rm ngspice-46.tar.gz \
    && mkdir -p ngspice-46/build && cd ngspice-46/build \
    && ../configure --prefix=/opt/ngspice --disable-debug --without-x \
       --with-readline=no --disable-openmp --enable-osdi \
    && make -j$(nproc) && make install \
    && cd /opt && rm -rf ngspice-46

# OpenVAF 23.5.0 linux binary (standalone)
RUN curl -sL -o openvaf.tar.gz \
      "https://openva.fra1.cdn.digitaloceanspaces.com/openvaf_23_5_0_linux_amd64.tar.gz" \
    && tar xzf openvaf.tar.gz && rm openvaf.tar.gz \
    && mv openvaf /opt/openvaf-bin && chmod +x /opt/openvaf-bin
ENV PATH="/opt/ngspice/bin:/opt:${PATH}"

# BSIM-CMG Verilog-A -> OSDI module
COPY bsimcmg_va /opt/bsimcmg_va
RUN cd /opt/bsimcmg_va && /opt/openvaf-bin -o bsimcmg_va.osdi bsimcmg.va \
    && cp bsimcmg_va.osdi /opt/ && ls -la /opt/bsimcmg_va.osdi

# ASAP7 OSDI model cards
COPY 7nm_TT_osdi.pm /opt/asap7/7nm_TT_osdi.pm

# smoke test
RUN printf '%s\n' \
    '.title asap7 osdi smoke' \
    '.include "/opt/asap7/7nm_TT_osdi.pm"' \
    'Vd d 0 0.7' \
    'Vg g 0 0.7' \
    'N1 d g 0 0 nmos_rvt L=21n NFIN=4' \
    'N2 d g 0 0 nmos_slvt L=21n NFIN=4' \
    'N3 d g 0 0 nmos_lvt L=21n NFIN=4' \
    'N4 0 0 d d pmos_rvt L=21n NFIN=4' \
    '.control' \
    'pre_osdi /opt/bsimcmg_va.osdi' \
    'op' \
    'print i(Vd)' \
    '.endc' \
    '.end' > /opt/smoke.cir \
    && ngspice -b /opt/smoke.cir

CMD ["ngspice"]
