.title ldo_tb_asap7_tb
* Testbench for ldo_tb (ASAP7). Corner is selected by the .lib section below;
* run all 12 corners with run_corners.sh (see README.md).
.include "circuit_asap7.cir"
* ldo_tb (Basic_LDO) migrated from sky130 (1.8V) to ASAP7 (0.7V)
* Devices: ASAP7 BSIM-CMG (level=72), parameterized by NFIN and L (nm)
* Feedback divider changed 300k/100k -> 100k/100k so that Vout = 2*Vref = 0.5V
* PMOS input pair (low ICM friendly), Iload max 55mA
***************************************
* Circuit netlist
***************************************
.lib "../../asap7_pdk/models/ngspice/asap7_osdi_corners.lib" tt_nom
***************************************
* Circuit parameters
***************************************
.PARAM VDD_NOM = 0.7
.PARAM supply_voltage = 'VDD_NOM*vdd_scale'
.PARAM Vref = 0.25
.PARAM PARAM_ILOAD =55m
.param N_BIASCM_PMOS=16 L_BIASCM_PMOS=21n
.param N_GM1_PMOS=16 L_GM1_PMOS=21n
.param N_GM2_PMOS=64 L_GM2_PMOS=21n
.param N_POWER_PMOS=12000 L_POWER_PMOS=21n
.param N_BIASCM_NMOS=8 L_BIASCM_NMOS=21n
.param N_LOAD2_NMOS=16 L_LOAD2_NMOS=21n
.param current_0_bias=1e-05
.param C_C0=4
.param C_LOAD=100
V1 vdd 0 'supply_voltage'
V2 vss 0 0
Vindc vref_in 0 'Vref'
Vin signal_in 0 dc 'Vref' ac 1 sin('Vref' 10m 500)
***************************************
* Testbenches
***************************************
*    ADM TB
x1 vss vdd vref_in vout1 vfb1 vinp1 Ib Basic_LDO_asap7
Ib Ib 0 DC='current_0_bias'
Lfb vinp1 vfb1 1T
Cfb vinp1 signal_in 1T
CL1 vout1 0 {C_LOAD*1p}
Iload1 vout1 0 'PARAM_ILOAD'
.nodeset v(vout1)=0.5
.control
pre_osdi ../../asap7_pdk/models/ngspice/bsimcmg_va.osdi
set seed=1234
set units=degrees
let NRUN = 200

* per-device Vth-mismatch sigma (Pelgrom-style assumption, see header;
* refreshed by benchmark/run_mc_baseline.py when sizes change)
* NM0: L=0.021um NFIN=16
let sg_nm0 = 1.3041e-02
* NM1: L=0.021um NFIN=16
let sg_nm1 = 1.3041e-02
* NM2: L=0.021um NFIN=16
let sg_nm2 = 1.3041e-02
* NM3: L=0.021um NFIN=16
let sg_nm3 = 1.3041e-02
* NM4: L=0.021um NFIN=32
let sg_nm4 = 9.2214e-03
* NM5: L=0.021um NFIN=16
let sg_nm5 = 1.3041e-02
* NM6: L=0.021um NFIN=16
let sg_nm6 = 1.3041e-02
* NM7: L=0.021um NFIN=16
let sg_nm7 = 1.3041e-02
* NM24: L=0.021um NFIN=16
let sg_nm24 = 1.3041e-02
* NM11: L=0.021um NFIN=1.2e+04
let sg_nm11 = 4.7619e-04
* NM10: L=0.021um NFIN=64
let sg_nm10 = 6.5205e-03
* NM8: L=0.021um NFIN=16
let sg_nm8 = 1.3041e-02
* NM9: L=0.021um NFIN=16
let sg_nm9 = 1.3041e-02
* NM14: L=0.021um NFIN=8
let sg_nm14 = 1.8443e-02
* NM12: L=0.021um NFIN=32
let sg_nm12 = 9.2214e-03
* NM13: L=0.021um NFIN=32
let sg_nm13 = 9.2214e-03
* NM15: L=0.021um NFIN=32
let sg_nm15 = 9.2214e-03
* NM16: L=0.021um NFIN=32
let sg_nm16 = 9.2214e-03
* NM17: L=0.021um NFIN=32
let sg_nm17 = 9.2214e-03
* NM18: L=0.021um NFIN=32
let sg_nm18 = 9.2214e-03
* NM19: L=0.021um NFIN=64
let sg_nm19 = 6.5205e-03
* NM20: L=0.021um NFIN=64
let sg_nm20 = 6.5205e-03
* NM21: L=0.021um NFIN=16
let sg_nm21 = 1.3041e-02
* NM22: L=0.021um NFIN=16
let sg_nm22 = 1.3041e-02

let run = 0
while run < NRUN
  * draw per-device mismatch for this sample
  alter @n.x1.nm0[delvtrand] = sg_nm0*sgauss(0)
  alter @n.x1.nm1[delvtrand] = sg_nm1*sgauss(0)
  alter @n.x1.nm2[delvtrand] = sg_nm2*sgauss(0)
  alter @n.x1.nm3[delvtrand] = sg_nm3*sgauss(0)
  alter @n.x1.nm4[delvtrand] = sg_nm4*sgauss(0)
  alter @n.x1.nm5[delvtrand] = sg_nm5*sgauss(0)
  alter @n.x1.nm6[delvtrand] = sg_nm6*sgauss(0)
  alter @n.x1.nm7[delvtrand] = sg_nm7*sgauss(0)
  alter @n.x1.nm24[delvtrand] = sg_nm24*sgauss(0)
  alter @n.x1.nm11[delvtrand] = sg_nm11*sgauss(0)
  alter @n.x1.nm10[delvtrand] = sg_nm10*sgauss(0)
  alter @n.x1.nm8[delvtrand] = sg_nm8*sgauss(0)
  alter @n.x1.nm9[delvtrand] = sg_nm9*sgauss(0)
  alter @n.x1.nm14[delvtrand] = sg_nm14*sgauss(0)
  alter @n.x1.nm12[delvtrand] = sg_nm12*sgauss(0)
  alter @n.x1.nm13[delvtrand] = sg_nm13*sgauss(0)
  alter @n.x1.nm15[delvtrand] = sg_nm15*sgauss(0)
  alter @n.x1.nm16[delvtrand] = sg_nm16*sgauss(0)
  alter @n.x1.nm17[delvtrand] = sg_nm17*sgauss(0)
  alter @n.x1.nm18[delvtrand] = sg_nm18*sgauss(0)
  alter @n.x1.nm19[delvtrand] = sg_nm19*sgauss(0)
  alter @n.x1.nm20[delvtrand] = sg_nm20*sgauss(0)
  alter @n.x1.nm21[delvtrand] = sg_nm21*sgauss(0)
  alter @n.x1.nm22[delvtrand] = sg_nm22*sgauss(0)

  alter Iload1 dc=55m
  op
  let vout_max = v(vout1)
  let iq_max = abs(i(v1))
  echo "MCRES $&run vout_max $&vout_max iq_max $&iq_max"
  ac dec 10 0.1 1G
  meas ac dcgain1 find vdb(vout1) at = 0.1
  meas ac ugf1 when vdb(vout1)=0
  meas ac pm1 find vp(vout1) when vdb(vout1)=0
  echo "MCRES $&run dcgain1 $&dcgain1 ugf1 $&ugf1 pm1 $&pm1"

  alter Iload1 dc=5m
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
