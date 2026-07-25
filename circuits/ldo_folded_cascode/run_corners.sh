#!/bin/bash
# Run the ASAP7 testbench (tb_asap7.sp) across all 12 PVT corners.
# Usage:  ./run_corners.sh [ngspice_binary]
# Requires: ngspice with OSDI + BSIM-CMG (see asap7_pdk/README.md), e.g.
#   ./run_corners.sh /Users/lujialin/lujialin/mc_sizing/opensource-circuits/asap7_pdk/bin/ngspice
NGSPICE=${1:-ngspice}
CORNERS="tt_nom tt_vlo_tlo tt_vhi_thi tt_vlo_thi ss_nom ss_vlo_thi ss_vhi_tlo ss_vlo_tlo ff_nom ff_vhi_thi ff_vlo_tlo ff_vhi_tlo"
mkdir -p corner_results
echo "corner vout_max dcgain1 ugf1 pm1 dcgain2 ugf2 pm2"
for c in $CORNERS; do
  sed "s/tt_nom/$c/" tb_asap7.sp > corner_results/tb_$c.sp
  $NGSPICE -b corner_results/tb_$c.sp > corner_results/$c.log 2>&1
  v=$(grep -m1 "vout_max" corner_results/$c.log | awk '{print $3}')
  g1=$(grep -m1 "dcgain1" corner_results/$c.log | awk '{print $3}')
  u1=$(grep -m1 "gain_bandwidth_product1" corner_results/$c.log | awk '{print $3}')
  p1=$(grep -m1 "phase_margin1" corner_results/$c.log | awk '{print $3}')
  g2=$(grep -m1 "dcgain2" corner_results/$c.log | awk '{print $3}')
  u2=$(grep -m1 "gain_bandwidth_product2" corner_results/$c.log | awk '{print $3}')
  p2=$(grep -m1 "phase_margin2" corner_results/$c.log | awk '{print $3}')
  echo "$c $v $g1 $u1 $p1 $g2 $u2 $p2"
done
