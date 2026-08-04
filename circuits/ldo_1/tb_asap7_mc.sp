.title ldo_1_asap7_tb
* Testbench for ldo_1 (ASAP7). Corner is selected by the .lib section below;
* run all 12 corners with run_corners.sh (see README.md).
.include "circuit_asap7.cir"
* ldo_1 migrated from sky130 (1.8V) to ASAP7 (0.7V)
* Devices: ASAP7 BSIM-CMG (level=72), parameterized by NFIN and L (nm)
* Feedback divider changed 300k/100k -> 40k/100k so that Vout = 1.4*Vref = 0.49V
* Iload max 100mA
***************************************
* Circuit netlist
***************************************
.lib "../../asap7_pdk/models/ngspice/asap7_osdi_corners.lib" tt_nom
***************************************
* Circuit parameters
***************************************
.param L_M0=21n N_M0=64
.param L_M1=21n N_M1=N_M0
.param L_M2=35n N_M2=41
.param L_M3=35n N_M3=N_M2
.param L_M4=21n N_M4=63
.param L_M5=21n N_M5=N_M4
.param L_M6=21n N_M6=157
.param L_M7=21n N_M7=4
.param L_M8=21n N_M8=28265
.param current_0_bias=2.000e-06
.param C_LOAD=286.4
.param C_CC=5
.PARAM VDD_NOM = 0.7
.PARAM supply_voltage = 'VDD_NOM*vdd_scale'
.PARAM Vref = 0.35
.PARAM PARAM_ILOAD =100m
V1 vdd 0 'supply_voltage'
V2 vss 0 0
Vindc vref_in 0 'Vref'
Vin signal_in 0 dc 'Vref' ac 1 sin('Vref' 10m 500)
***************************************
* Testbenches
***************************************
*    ADM TB
x1 vss vdd vref_in vout1 vfb1 vinp1 Ib ldo_1_asap7
Ib vdd Ib DC='current_0_bias'
Lfb vinp1 vfb1 1T
Cfb vinp1 signal_in 1T
CL1 vout1 0 {C_LOAD*1p}
Iload1 vout1 0 'PARAM_ILOAD'
.nodeset v(vout1)=0.49
.control
pre_osdi ../../asap7_pdk/models/ngspice/bsimcmg_va.osdi
set seed=1234
set units=degrees
let NRUN = 200

* per-device Vth-mismatch sigma (Pelgrom-style assumption, see header;
* refreshed by benchmark/run_mc_baseline.py when sizes change)
* NM8: L=0.021um NFIN=2.826e+04
let sg_nm8 = 3.1028e-04
* NM1: L=0.021um NFIN=64
let sg_nm1 = 6.5205e-03
* NM0: L=0.021um NFIN=64
let sg_nm0 = 6.5205e-03
* NM6: L=0.021um NFIN=157
let sg_nm6 = 4.1631e-03
* NM7: L=0.021um NFIN=4
let sg_nm7 = 2.6082e-02
* NM5: L=0.021um NFIN=63
let sg_nm5 = 6.5721e-03
* NM4: L=0.021um NFIN=63
let sg_nm4 = 6.5721e-03
* NM3: L=0.035um NFIN=41
let sg_nm3 = 6.3104e-03
* NM2: L=0.035um NFIN=41
let sg_nm2 = 6.3104e-03

let run = 0
while run < NRUN
  * draw per-device mismatch for this sample
  alter @n.x1.nm8[delvtrand] = sg_nm8*sgauss(0)
  alter @n.x1.nm1[delvtrand] = sg_nm1*sgauss(0)
  alter @n.x1.nm0[delvtrand] = sg_nm0*sgauss(0)
  alter @n.x1.nm6[delvtrand] = sg_nm6*sgauss(0)
  alter @n.x1.nm7[delvtrand] = sg_nm7*sgauss(0)
  alter @n.x1.nm5[delvtrand] = sg_nm5*sgauss(0)
  alter @n.x1.nm4[delvtrand] = sg_nm4*sgauss(0)
  alter @n.x1.nm3[delvtrand] = sg_nm3*sgauss(0)
  alter @n.x1.nm2[delvtrand] = sg_nm2*sgauss(0)

  alter Iload1 dc=100m
  op
  let vout_max = v(vout1)
  let iq_max = abs(i(v1))
  echo "MCRES $&run vout_max $&vout_max iq_max $&iq_max"
  ac dec 10 0.1 1G
  meas ac dcgain1 find vdb(vout1) at = 0.1
  meas ac ugf1 when vdb(vout1)=0
  meas ac pm1 find vp(vout1) when vdb(vout1)=0
  echo "MCRES $&run dcgain1 $&dcgain1 ugf1 $&ugf1 pm1 $&pm1"

  alter Iload1 dc=1m
  op
  let vout_min = v(vout1)
  let iq_min = abs(i(v1))
  echo "MCRES $&run vout_min $&vout_min iq_min $&iq_min"
  ac dec 10 0.1 1G
  meas ac dcgain2 find vdb(vout1) at = 0.1
  meas ac ugf2 when vdb(vout1)=0
  meas ac pm2 find vp(vout1) when vdb(vout1)=0
  echo "MCRES $&run dcgain2 $&dcgain2 ugf2 $&ugf2 pm2 $&pm2"
  let run = run + 1
end
.endc

.end
